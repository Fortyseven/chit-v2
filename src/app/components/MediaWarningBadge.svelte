<script lang="ts">
    import { Cloud_off } from "svelte-google-materialdesign-icons"

    /**
     * Badge shown on media the currently selected model can't consume
     * (it is saved/displayed but stripped from the outgoing LLM payload).
     *
     * "corner" = absolute badge pinned near the top-right of the nearest
     * positioned ancestor (thumbnails / audio cards); offset via `top`/`right`.
     * "inline" = plain inline icon (flex layouts).
     */
    export let placement: "corner" | "inline" = "inline"
    export let top: number = 4
    export let right: number = 4
    export let warningMessage: string = "Will not be sent to the model"
</script>

<span
    class="media-warning-badge {placement}"
    style:top={placement === "corner" ? `${top}px` : undefined}
    style:right={placement === "corner" ? `${right}px` : undefined}
    title={warningMessage}
    role="img"
    aria-label={warningMessage}
>
    <Cloud_off size={16} color="white" ariaLabel={warningMessage} />
</span>

<style>
    .media-warning-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 1px;
        border-radius: 50%;
        background-color: var(--color-error, #cc0000);
        border: 1px solid rgba(0, 0, 0, 0.4);
        line-height: 0;
        user-select: none;
    }

    .media-warning-badge.corner {
        position: absolute;
        z-index: 1;
    }
</style>
