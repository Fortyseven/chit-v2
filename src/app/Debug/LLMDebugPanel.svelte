<script lang="ts">
    import {
        llmDebugLog,
        llmDebugLogClear,
        llmDebugPanelOpen,
        type LLMDebugExchange,
    } from "$lib/llm/llmDebugLog"

    /** Strings longer than this are candidates for binary detection. */
    const BINARY_MIN_LENGTH = 200

    /**
     * Heuristic for non-text (binary) payloads in the wire format:
     * data URLs (images), the input_audio.data field, and any long
     * whitespace-free blob (base64 audio, hashes, etc.). Regular text
     * — prompts, messages, attached text files — always passes through.
     */
    function isBinaryPayload(str: string, key?: string): boolean {
        if (str.length <= BINARY_MIN_LENGTH) return false
        if (key === "data") return true
        if (str.startsWith("data:")) return true
        return !str.includes(" ") && !str.includes("\n") && !str.includes("\t")
    }

    /**
     * Deep-copy a value for display, omitting binary media payloads
     * (base64 images/audio) but keeping all text content in full.
     * The full value stays in the log store and is what Copy uses.
     */
    function shrink(value: any, key?: string): any {
        if (typeof value === "string") {
            if (isBinaryPayload(value, key)) {
                return `[binary data: ${value.length.toLocaleString()} chars omitted]`
            }
            return value
        }
        if (Array.isArray(value)) {
            return value.map((v) => shrink(v))
        }
        if (value !== null && typeof value === "object") {
            const out: Record<string, any> = {}
            for (const [k, v] of Object.entries(value)) out[k] = shrink(v, k)
            return out
        }
        return value
    }

    /**
     * Memoized request rendering: a request never changes after it is
     * recorded, so stringify (potentially megabytes of base64) once per
     * exchange and reuse. Returns the display JSON and the full size.
     */
    const requestViewCache = new Map<string, { json: string; size: string }>()

    function describeRequest(entry: LLMDebugExchange): {
        json: string
        size: string
    } {
        let view = requestViewCache.get(entry.id)
        if (view === undefined) {
            const full = JSON.stringify(entry.request)
            const bytes = new TextEncoder().encode(full).length
            const size =
                bytes < 1024
                    ? `${bytes} B`
                    : bytes < 1024 * 1024
                      ? `${(bytes / 1024).toFixed(1)} KB`
                      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`
            view = { json: JSON.stringify(shrink(entry.request), null, 2), size }
            requestViewCache.set(entry.id, view)
        }
        return view
    }

    // Prune cache entries that have fallen out of the (bounded) log
    $: {
        const ids = new Set($llmDebugLog.map((e) => e.id))
        for (const key of requestViewCache.keys()) {
            if (!ids.has(key)) requestViewCache.delete(key)
        }
    }

    function formatTime(ts: number): string {
        return new Date(ts).toLocaleTimeString()
    }

    function formatDuration(ms: number): string {
        return `${(ms / 1000).toFixed(1)}s`
    }

    function statusOf(entry: LLMDebugExchange): string {
        return entry.response?.status ?? "pending"
    }

    // Newest exchange is expanded by default; manual toggles win after
    let expanded: Record<string, boolean> = {}
    $: latestId = $llmDebugLog[0]?.id
    $:
        if (latestId && expanded[latestId] === undefined) {
            expanded = { ...expanded, [latestId]: true }
        }

    function toggle(id: string): void {
        expanded = { ...expanded, [id]: !(expanded[id] ?? false) }
    }

    function responseDump(entry: LLMDebugExchange): string {
        return JSON.stringify(entry.response ?? null, null, 2)
    }

    let copied: string | undefined
    let copyTimer: ReturnType<typeof setTimeout> | undefined

    /** Copy text to the clipboard and flash a "Copied" confirmation. */
    async function copy(key: string, text: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(text)
            copied = key
            if (copyTimer) clearTimeout(copyTimer)
            copyTimer = setTimeout(() => (copied = undefined), 1500)
        } catch (e) {
            console.error("Debug panel copy failed:", e)
        }
    }

    function close(): void {
        llmDebugPanelOpen.set(false)
    }
</script>

{#if $llmDebugPanelOpen}
    <aside class="debug-panel">
        <header>
            <div class="titles">
                <h2>LLM Debug</h2>
                <span class="hint">client ⇄ LLM traffic · ALT+C to toggle</span>
            </div>
            <div class="actions">
                <button class="small" on:click={() => llmDebugLogClear()}>
                    Clear
                </button>
                <button class="small secondary" on:click={close}
                    >✕ Close</button
                >
            </div>
        </header>

        <p class="note">
            Base64 media (images/audio) is omitted from the view — Copy grabs
            the full JSON. Responses show the final session state, not raw
            stream chunks.
        </p>

        <div class="entries">
            {#if $llmDebugLog.length === 0}
                <p class="empty">
                    No LLM calls recorded yet.
                    <br />
                    Send a message, then open this panel with <kbd>ALT+C</kbd>.
                </p>
            {/if}
            {#each $llmDebugLog as entry (entry.id)}
                <article class="exchange">
                    <button
                        class="exchange-header"
                        on:click={() => toggle(entry.id)}
                    >
                        <span class="chev"
                            >{expanded[entry.id] ? "▾" : "▸"}</span
                        >
                        <span class="label">{entry.label}</span>
                        <span class="model">{entry.model}</span>
                        <span class="meta">{formatTime(entry.timestamp)}</span>
                        {#if entry.durationMs !== undefined}
                            <span class="meta"
                                >{formatDuration(entry.durationMs)}</span
                            >
                        {/if}
                        <span class="badge status-{statusOf(entry)}"
                            >{statusOf(entry)}</span
                        >
                    </button>

                    {#if expanded[entry.id]}
                        <section class="part">
                            <div class="part-head">
                                <h3>
                                    → Request to LLM
                                    <span class="size"
                                        >{describeRequest(entry).size}</span
                                    >
                                </h3>
                                <button
                                    class="small"
                                    on:click={() =>
                                        copy(
                                            entry.id + ":req",
                                            JSON.stringify(
                                                entry.request,
                                                null,
                                                2,
                                            )
                                        )}
                                >
                                    {copied === entry.id + ":req"
                                        ? "Copied ✓"
                                        : "Copy"}
                                </button>
                            </div>
                            <pre>{describeRequest(entry).json}</pre>
                        </section>

                        <section class="part">
                            <div class="part-head">
                                <h3>
                                    ← Response
                                    {#if entry.kind === "chat"}
                                        <span class="sub"
                                            >(final session state)</span
                                        >
                                    {/if}
                                </h3>
                                {#if entry.response}
                                    <button
                                        class="small"
                                        on:click={() =>
                                            copy(
                                                entry.id + ":res",
                                                responseDump(entry),
                                            )}
                                    >
                                        {copied === entry.id + ":res"
                                            ? "Copied ✓"
                                            : "Copy"}
                                    </button>
                                {/if}
                            </div>
                            {#if !entry.response}
                                <p class="pending">…in flight…</p>
                            {:else}
                                {#if entry.response.error}
                                    <div class="field error-field">
                                        <h4>error</h4>
                                        <pre class="plain"
                                            >{entry.response.error}</pre
                                        >
                                    </div>
                                {/if}
                                {#if entry.response.thoughts}
                                    <div class="field">
                                        <h4>thoughts</h4>
                                        <pre class="plain"
                                            >{entry.response.thoughts}</pre
                                        >
                                    </div>
                                {/if}
                                {#if entry.response.toolCalls
                                    && entry.response.toolCalls.length > 0}
                                    <div class="field">
                                        <h4>tool calls</h4>
                                        <pre>{
                                            JSON.stringify(
                                                shrink(entry.response
                                                    .toolCalls),
                                                null,
                                                2,
                                            )
                                        }</pre>
                                    </div>
                                {/if}
                                {#if entry.response.content}
                                    <div class="field">
                                        <h4>content</h4>
                                        <pre class="plain"
                                            >{entry.response.content}</pre
                                        >
                                    </div>
                                {/if}
                                {#if !entry.response.error
                                    && !entry.response.thoughts
                                    && !(
                                        entry.response.toolCalls
                                            && entry.response.toolCalls
                                                .length > 0
                                    )
                                    && !entry.response.content}
                                    <p class="pending">(empty)</p>
                                {/if}
                            {/if}
                        </section>
                    {/if}
                </article>
            {/each}
        </div>
    </aside>
{/if}

<style lang="scss">
    .debug-panel {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        width: min(46vw, 860px);
        min-width: 380px;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        background: var(--color-background-darker);
        border-left: 2px solid var(--color-accent-darker);
        box-shadow: -8px 0 30px #000a;
        color: var(--color-text);
        font-family: var(--font-ui);

        header {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1em;
            padding: 0.75em 1em;
            border-bottom: 1px solid #444;

            .titles {
                display: flex;
                align-items: baseline;
                gap: 0.75em;
                min-width: 0;

                h2 {
                    margin: 0;
                    font-size: 1.25em;
                    color: var(--color-accent-lighter);
                }

                .hint {
                    font-size: 0.85em;
                    opacity: 0.7;
                    white-space: nowrap;
                }
            }

            .actions {
                display: flex;
                gap: 0.5em;
                flex-shrink: 0;
            }
        }

        .note {
            flex-shrink: 0;
            margin: 0;
            padding: 0.5em 1em;
            font-size: 0.8em;
            opacity: 0.6;
            border-bottom: 1px solid #333;
        }

        .entries {
            flex: 1;
            overflow-y: auto;
            padding: 0.75em 1em 2em;
        }

        .empty {
            opacity: 0.6;
            font-size: 0.95em;

            kbd {
                background: var(--color-background-lighter);
                border-radius: 4px;
                padding: 0.1em 0.4em;
                font-family: monospace;
            }
        }

        .exchange {
            margin-bottom: 1em;
            border: 1px solid #444;
            border-radius: var(--border-radius-standard);
            background: var(--color-background);
            overflow: hidden;

            .exchange-header {
                display: flex;
                align-items: center;
                gap: 0.6em;
                width: 100%;
                background: var(--color-background-lighter);
                color: var(--color-neutral-lighter);
                border: none;
                border-radius: 0;
                padding: 0.5em 0.75em;
                font-family: var(--font-ui);
                font-size: 0.95em;
                text-align: left;

                &:hover {
                    background: var(--color-background-lightest);
                }

                .chev {
                    width: 1em;
                    opacity: 0.7;
                }

                .label {
                    font-weight: 600;
                }

                .model {
                    color: var(--color-accent-complement-lighter);
                    font-family: monospace;
                    font-size: 0.9em;
                }

                .meta {
                    opacity: 0.6;
                    font-size: 0.85em;
                }

                .badge {
                    margin-left: auto;
                    padding: 0.1em 0.5em;
                    border-radius: 4px;
                    font-size: 0.8em;
                    font-weight: 600;
                    text-transform: uppercase;
                    background: var(--color-background-lightest);
                    color: var(--color-neutral-lighter);
                }

                .badge.status-ok {
                    background: var(--color-success);
                    color: var(--color-success-text);
                }

                .badge.status-error {
                    background: var(--color-error);
                    color: var(--color-error-text);
                }

                .badge.status-aborted {
                    background: var(--color-warning);
                    color: var(--color-warning-text);
                }
            }

            .part {
                padding: 0.5em 0.75em 0.75em;

                & + .part {
                    border-top: 1px dashed #444;
                }

                .part-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.5em;
                    margin-bottom: 0.4em;

                    h3 {
                        margin: 0;
                        font-size: 0.95em;
                        font-weight: 600;
                        color: var(--color-neutral-lighter);

                        .size {
                            margin-left: 0.5em;
                            font-weight: normal;
                            font-size: 0.85em;
                            opacity: 0.6;
                        }

                        .sub {
                            font-weight: normal;
                            font-size: 0.85em;
                            opacity: 0.6;
                        }
                    }
                }

                pre {
                    margin: 0;
                    padding: 0.6em;
                    background: var(--color-background-darkest);
                    border-radius: var(--border-radius-standard);
                    border: 1px solid #333;
                    font-family: monospace;
                    font-size: 0.8em;
                    line-height: 1.3;
                    overflow-x: auto;
                    white-space: pre-wrap;
                    word-break: break-word;
                    max-height: 30em;
                    overflow-y: auto;
                    color: var(--color-accent-lightest);

                    &.plain {
                        color: var(--color-neutral-lighter);
                    }
                }

                .field {
                    margin-top: 0.5em;

                    h4 {
                        margin: 0 0 0.25em;
                        font-size: 0.85em;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        color: var(--color-accent-complement);
                    }
                }

                .error-field h4 {
                    color: var(--color-error-lighter);
                }

                .pending {
                    margin: 0.4em 0;
                    opacity: 0.6;
                    font-style: italic;
                }
            }
        }
    }
</style>
