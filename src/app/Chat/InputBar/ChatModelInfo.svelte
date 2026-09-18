<script lang="ts">
    import { currentChat } from "$lib/chatSession/chatSession"
    import {
        findRouterModel,
        formatCtx,
        formatParams,
        routerModelInfos,
    } from "$lib/llm/routerModels"

    /** Router info for the currently selected model (undefined on non-router). */
    $: selectedInfo = $currentChat
        ? findRouterModel($routerModelInfos, $currentChat.model_name)
        : undefined
    $: selectedStatus = selectedInfo?.status?.value ?? ""

    $: ctxLabel = (() => {
        if (!selectedInfo?.meta?.n_ctx) return ""
        const loaded = formatCtx(selectedInfo.meta.n_ctx)
        const trained = formatCtx(selectedInfo.meta.n_ctx_train)
        return trained ? `${loaded} / ${trained} ctx` : `${loaded} ctx`
    })()

    /** Params + quant from the router's merged meta ("8B Q4_K_M"). */
    $: paramLabel = (() => {
        const meta = selectedInfo?.meta
        if (!meta) return ""
        const bits: string[] = []
        const params = formatParams(meta.n_params)
        if (params) bits.push(params)
        if (meta.ftype) bits.push(meta.ftype)
        return bits.join(" ")
    })()

    $: statusLabel = ({
        loading: "loading…",
        loaded: "loaded",
        sleeping: "asleep",
        downloading: "downloading…",
        downloaded: "downloaded",
        unloaded: "not loaded",
        failed: "failed",
    } as Record<string, string>)[selectedStatus] ?? ""

    $: statusKind =
        selectedStatus === "loaded"
            ? "ok"
            : selectedStatus === "failed"
              ? "bad"
              : selectedStatus === "loading" || selectedStatus === "downloading"
                ? "busy"
                : "muted"
</script>

{#if selectedInfo}
    <div class="model-info">
        {#if statusLabel}
            <span class="status status-{statusKind}">{statusLabel}</span>
        {/if}
        {#if paramLabel}<span class="ctx">{paramLabel}</span>{/if}
        {#if ctxLabel}<span class="ctx">{ctxLabel}</span>{/if}
        {#if selectedInfo.tags?.length}
            <span class="tags" title={selectedInfo.tags.join(", ")}>
                {selectedInfo.tags.join(", ")}
            </span>
        {/if}
    </div>
{/if}

<style lang="scss">
    .model-info {
        display: flex;
        align-items: center;
        gap: 0.75em;
        font-size: 0.72em;
        white-space: nowrap;
        overflow: hidden;

        .status {
            font-weight: 500;
            &.status-ok {
                color: var(--color-accent);
            }
            &.status-bad {
                color: var(--color-error, #f66);
            }
            &.status-busy {
                color: #ff8;
                animation: pulse 1.5s infinite;
            }
            &.status-muted {
                color: var(--color-text-muted, #888);
            }
        }

        .ctx {
            color: var(--color-text-muted, #888);
        }

        .tags {
            color: var(--color-text-muted, #888);
            opacity: 0.7;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        @keyframes pulse {
            50% {
                opacity: 0.45;
            }
        }
    }
</style>
