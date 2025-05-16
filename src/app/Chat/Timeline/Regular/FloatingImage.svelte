<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte"

    export let src: string
    export let alt: string = "Floating Image"

    let dragging = false
    let resizing = false
    let x = window.innerWidth / 4
    let y = window.innerHeight / 4
    let width = 400
    let height = 400
    let startX = 0
    let startY = 0
    let startWidth = 0
    let startHeight = 0
    let imageElement: HTMLImageElement
    let aspectRatio = 1

    const dispatch = createEventDispatcher()

    function handleMouseDown(event: MouseEvent) {
        dragging = true
        startX = event.clientX - x
        startY = event.clientY - y
        event.preventDefault()
    }

    function handleResizeStart(event: MouseEvent) {
        resizing = true
        startX = event.clientX
        startY = event.clientY
        startWidth = width
        startHeight = height
        event.preventDefault()
        event.stopPropagation()
    }

    function handleMouseMove(event: MouseEvent) {
        if (dragging) {
            x = event.clientX - startX
            y = event.clientY - startY
        } else if (resizing) {
            // Calculate the new width based on mouse movement
            width = Math.max(200, startWidth + (event.clientX - startX))
            // Adjust height to maintain aspect ratio
            height = width / aspectRatio
        }
    }

    function handleMouseUp() {
        dragging = false
        resizing = false
    }

    function closeImage() {
        dispatch("close")
    }

    onMount(() => {
        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseup", handleMouseUp)

        // Set initial aspect ratio when image loads
        if (imageElement) {
            imageElement.onload = () => {
                aspectRatio =
                    imageElement.naturalWidth / imageElement.naturalHeight
                // Set initial height based on aspect ratio
                height = width / aspectRatio
            }
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)
        }
    })
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="floating-image-container"
    style="left: {x}px; top: {y}px; width: {width}px; height: {height}px;"
    on:mousedown={handleMouseDown}
>
    <div class="toolbar">
        <button class="close-button" on:click={closeImage}>×</button>
    </div>
    <img bind:this={imageElement} {src} {alt} class="floating-image" />
    <div class="resize-handle" on:mousedown={handleResizeStart}></div>
</div>

<style>
    .floating-image-container {
        position: fixed;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.95);
        border-radius: var(--border-radius-standard);
        box-shadow: 0px 30px 1em #000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        cursor: move;
    }

    .toolbar {
        display: flex;
        justify-content: flex-end;
        padding: 8px;
        background: rgba(0, 0, 0, 0.5);
    }

    .close-button {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0 8px;
    }

    .floating-image {
        max-width: 100%;
        max-height: calc(100% - 40px);
        object-fit: contain;
        margin: auto;
    }

    .resize-handle {
        position: absolute;
        width: 20px;
        height: 20px;
        bottom: 0;
        right: 0;
        cursor: nwse-resize;
        background: rgba(255, 255, 255, 0.3);
    }

    .resize-handle:hover {
        background: rgba(255, 255, 255, 0.5);
    }
</style>
