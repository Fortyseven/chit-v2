import { onMount, onDestroy } from "svelte"
import { fade } from "svelte/transition"

export let blob: Blob
export let caption: string | undefined = undefined
export let onClose: () => void

let imageUrl: string | null = null
let keydownHandler: ((e: KeyboardEvent) => void) | null = null

onMount(async () => {
    imageUrl = URL.createObjectURL(blob)

    keydownHandler = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            onClose()
        }
    }
    document.addEventListener("keydown", keydownHandler)
})

onDestroy(() => {
    if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
    }
    if (keydownHandler) {
        document.removeEventListener("keydown", keydownHandler)
    }
})

function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
        onClose()
    }
}
</script>

<div
    class="image-lightbox-overlay"
    transition:fade={{ duration: 200 }}
    on:click={handleBackdropClick}
>
    <div class="lightbox-content" on:click|stopPropagation>
        <button
            class="close-button"
            on:click={onClose}
            title="Close (Esc)"
        >
            ✕
        </button>

        {#if imageUrl}
            <img
                src={imageUrl}
                alt={caption || "Image"}
                class="lightbox-image"
            />
        {/if}

        {#if caption}
            <div class="lightbox-caption">
                {caption}
            </div>
        {/if}
    </div>
</div>

<style lang="scss">
    .image-lightbox-overlay {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.85);
        z-index: 10002;
        padding: 1em;
        cursor: zoom-out;
    }

    .lightbox-content {
        position: relative;
        max-width: 90vw;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75em;
        cursor: default;
    }

    .close-button {
        position: absolute;
        top: -0.6em;
        right: -0.6em;
        background: #111;
        color: #ccc;
        border: 1px solid #555;
        border-radius: 50%;
        width: 2em;
        height: 2em;
        font-size: 1em;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1;
        transition: all 0.2s ease;

        &:hover {
            background: #222;
            border-color: var(--color-accent);
            color: var(--color-accent);
        }
    }

    .lightbox-image {
        max-width: 85vw;
        max-height: 75vh;
        border-radius: 10px;
        object-fit: contain;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }

    .lightbox-caption {
        max-width: 85vw;
        max-height: 10vh;
        overflow-y: auto;
        padding: 0.5em 0.75em;
        background: #111;
        border: 1px solid #444;
        border-radius: 6px;
        font-size: 0.8em;
        line-height: 1.4;
        color: #ccc;
        opacity: 0.9;
        text-align: center;
    }
</style>
