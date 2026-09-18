/**
 * Live model info from the llama.cpp router (native GET /models + /models/sse),
 * plus slot-level runtime stats (proxied GET /slots?model=X).
 *
 * Plain OpenAI-compatible backends don't have these endpoints; every helper
 * and store here degrades to empty/null so the UI falls back to legacy
 * behavior (fail-open).
 */
import { writable } from "svelte/store"

/** One entry from the router's native GET /models endpoint. */
export interface RouterModelInfo {
    id: string
    aliases?: string[]
    tags?: string[]
    source?: string
    can_remove?: boolean
    status?: {
        // downloading|downloaded|unloaded|loading|loaded|sleeping
        value?: string
        args?: string[]
        preset?: string
        exit_code?: number
        failed?: boolean
    }
    architecture?: {
        input_modalities?: string[]
        output_modalities?: string[]
    }
    /** Merged from the child server once the model is active (n_ctx etc). */
    meta?: {
        n_ctx?: number
        n_ctx_train?: number
        n_vocab?: number
        n_params?: number
        size?: number
        ftype?: string
        [key: string]: unknown
    }
}

/** One entry from a (proxied) GET /slots response. */
export interface RouterSlotInfo {
    id: number
    n_ctx: number
    speculative?: boolean
    is_processing?: boolean
    id_task?: number
    n_prompt_tokens?: number
    n_prompt_tokens_processed?: number
    n_prompt_tokens_cache?: number
    next_token?: Array<{
        has_next_token: boolean
        has_new_line: boolean
        n_remain: number
        n_decoded: number
    }>
}

/** Aggregated slot state for one model, kept fresh by polling. */
export interface RouterSlotStatus {
    busy: boolean
    /** Prompt + generated tokens: actual server-side context occupancy. */
    usedTokens: number
    ctxTokens: number
    promptTokens: number
    cachedTokens: number
    /** Sampled from n_decoded deltas; undefined until 2+ samples exist. */
    tokensPerSec?: number
}

/** Minimal driver surface needed by the monitors below. */
export interface RouterDriver {
    /** Base URL without the /v1 suffix (where native endpoints live). */
    readonly routerBase: string
    getRouterModels(): Promise<RouterModelInfo[] | null>
    getRouterSlots(model: string): Promise<RouterSlotInfo[] | null>
}

/** Router model entries keyed by id. Empty when the backend is not a router. */
export const routerModelInfos = writable<Record<string, RouterModelInfo>>(
    {},
)

/** Live slot stats for the model currently being polled (null = unavailable). */
export const routerSlotStatus = writable<RouterSlotStatus | null>(null)

/** Find a model entry by id or alias. */
export function findRouterModel(
    infos: Record<string, RouterModelInfo>,
    name: string,
): RouterModelInfo | undefined {
    if (!name) return undefined
    if (infos[name]) return infos[name]
    for (const info of Object.values(infos)) {
        if (info.aliases?.includes(name)) return info
    }
    return undefined
}

/**
 * Can the model consume a given input modality ("image" | "audio")?
 * Fails open: unknown info (non-router backend, older router build without
 * architecture data) allows attachment.
 */
export function modelSupportsModality(
    info: RouterModelInfo | undefined,
    modality: "image" | "audio",
): boolean {
    const modalities = info?.architecture?.input_modalities
    if (!modalities) return true
    return modalities.includes(modality)
}

/** 16478233600 -> "16.5B" (parameter count). */
export function formatParams(n?: number): string {
    if (!n || n <= 0) return ""
    if (n >= 1e9) return `${trimZero((n / 1e9).toFixed(1))}B`
    if (n >= 1e6) return `${trimZero((n / 1e6).toFixed(1))}M`
    return `${n}`
}

/** 4930000000 -> "4.9GB" (file size in bytes). */
export function formatBytes(n?: number): string {
    if (!n || n <= 0) return ""
    if (n >= 1e9) return `${trimZero((n / 1e9).toFixed(1))}GB`
    if (n >= 1e6) return `${trimZero((n / 1e6).toFixed(0))}MB`
    return `${n}B`
}

/** 4096 -> "4k", 131072 -> "128k" (context token counts). */
export function formatCtx(n?: number): string {
    if (!n || n <= 0) return ""
    if (n >= 1024) return `${trimZero((n / 1024).toFixed(1))}k`
    return `${n}`
}

function trimZero(s: string): string {
    return s.replace(/\.0$/, "")
}

/* ------------------------------------------------------------------ */
/* Model monitor: initial fetch + SSE (polling fallback)               */
/* ------------------------------------------------------------------ */

let closeMonitor: (() => void) | null = null

/**
 * Start tracking router model statuses: fetches /models once, then keeps
 * the store fresh via the /models/sse event stream. If SSE is unavailable
 * (older build, API-key-protected stream, or repeated errors), falls back
 * to polling every 5s. Safe to call repeatedly - stops the prior monitor.
 */
export function startRouterMonitor(
    driver: RouterDriver,
    onModelsChanged?: () => void,
): void {
    stopRouterMonitor()

    const refresh = async () => {
        let infos: RouterModelInfo[] | null
        try {
            infos = await driver.getRouterModels()
        } catch (e) {
            console.debug("routerModels: refresh failed", e)
            return
        }
        if (!infos) return // not a llama.cpp router
        const map: Record<string, RouterModelInfo> = {}
        for (const m of infos) map[m.id] = m
        routerModelInfos.set(map)
    }

    let pollTimer: ReturnType<typeof setInterval> | null = null
    const startPolling = (intervalMs: number) => {
        if (pollTimer) return
        pollTimer = setInterval(refresh, intervalMs)
    }

    let es: EventSource | null = null
    let esErrors = 0
    es = new EventSource(`${driver.routerBase}/models/sse`)
    es.onmessage = (e) => {
        esErrors = 0
        let evt: { event?: string } = {}
        try {
            evt = JSON.parse(e.data)
        } catch {
            // ignore malformed frames
        }
        refresh()
        if (
            evt.event === "models_reload" ||
            evt.event === "download_finished" ||
            evt.event === "download_failed" ||
            evt.event === "model_remove"
        ) {
            onModelsChanged?.()
        }
    }
    es.onerror = () => {
        // EventSource auto-retries; if it keeps failing, switch to polling
        esErrors++
        if (esErrors >= 3) {
            es?.close()
            es = null
            startPolling(5000)
        }
    }

    void refresh()

    closeMonitor = () => {
        if (pollTimer) clearInterval(pollTimer)
        pollTimer = null
        es?.close()
        es = null
        closeMonitor = null
    }
}

export function stopRouterMonitor(): void {
    closeMonitor?.()
}

/* ------------------------------------------------------------------ */
/* Slot polling: live context fill + tokens/sec for one model          */
/* ------------------------------------------------------------------ */

let slotPollTimer: ReturnType<typeof setInterval> | null = null
let slotPollModel = ""
let slotSamples: Array<{ t: number; decoded: number }> = []

/**
 * Poll GET /slots?model=X once per second, aggregating the result into
 * routerSlotStatus (busy flag, real context occupancy, tokens/sec sampled
 * from generated-token deltas). Clears stale status when the polled model
 * changes; retains the last (settled) status when stopped.
 */
export async function startSlotPolling(
    driver: RouterDriver,
    model: string,
): Promise<void> {
    stopSlotPolling()
    slotSamples = []
    slotPollModel = model
    if (model) routerSlotStatus.set(null)

    const tick = async () => {
        let slots: RouterSlotInfo[] | null
        try {
            slots = await driver.getRouterSlots(model)
        } catch (e) {
            console.debug("slot polling failed", e)
            return
        }
        if (!slots || slots.length === 0) return
        // Prefer the busy slot; otherwise report the first slot
        const slot = slots.find((s) => s.is_processing) ?? slots[0]
        const decoded = slot.next_token?.[0]?.n_decoded ?? 0
        const prompt = slot.n_prompt_tokens ?? 0

        const now = Date.now()
        slotSamples.push({ t: now, decoded })
        while (slotSamples.length > 2 && now - slotSamples[0].t > 4000) {
            slotSamples.shift()
        }

        let tokensPerSec: number | undefined
        if (slot.is_processing && slotSamples.length >= 2) {
            const first = slotSamples[0]
            const last = slotSamples[slotSamples.length - 1]
            const dt = (last.t - first.t) / 1000
            if (dt > 0.1 && last.decoded >= first.decoded) {
                tokensPerSec = Math.round((last.decoded - first.decoded) / dt)
            }
        }

        routerSlotStatus.set({
            busy: !!slot.is_processing,
            usedTokens: prompt + decoded,
            ctxTokens: slot.n_ctx,
            promptTokens: prompt,
            cachedTokens: slot.n_prompt_tokens_cache ?? 0,
            tokensPerSec,
        })
    }

    await tick()
    slotPollTimer = setInterval(tick, 1000)
}

export function stopSlotPolling(): void {
    if (slotPollTimer) {
        clearInterval(slotPollTimer)
        slotPollTimer = null
    }
    slotPollModel = ""
}

/** The model currently being polled by startSlotPolling ("" if none). */
export function slotPolledModel(): string {
    return slotPollModel
}
