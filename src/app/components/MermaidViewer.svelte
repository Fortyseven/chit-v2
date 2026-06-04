<script lang="ts">
    import { onDestroy, tick } from "svelte"

    export let open = false
    export let svgContent = ""
    let keydownHandler

    // Pan and zoom state
    let scale = 1
    let panX = 0
    let panY = 0
    let isPanning = false
    let startX = 0
    let startY = 0
    let startPanX = 0
    let startPanY = 0

    let viewerContainer: HTMLDivElement
    let svgContainer: HTMLDivElement

    function closeViewer() {
        open = false
        resetView()
    }

    function resetView() {
        scale = 1
        // Center the diagram in the viewport, zoomed to fit
        tick().then(() => {
            if (!viewerContainer || !svgContainer) return
            const vRect = viewerContainer.getBoundingClientRect()
            const sRect = svgContainer.getBoundingClientRect()
            // Fit to viewport, whichever dimension is the constraint
            const fitScale = Math.min(
                vRect.width / sRect.width,
                vRect.height / sRect.height,
            )
            scale = fitScale
            panX = (vRect.width - sRect.width * fitScale) / 2
            panY = (vRect.height - sRect.height * fitScale) / 2
        })
    }

    function handleKeydown(event) {
        if (event.key === "Escape" && open) {
            closeViewer()
        }
    }

    $: {
        if (open) {
            window.addEventListener("keydown", handleKeydown)
            keydownHandler = handleKeydown
            // Center the diagram when the viewer opens
            resetView()
        } else if (keydownHandler) {
            window.removeEventListener("keydown", keydownHandler)
        }
    }

    onDestroy(() => {
        if (keydownHandler) {
            window.removeEventListener("keydown", keydownHandler)
        }
    })

    // Handle pan (mouse drag)
    function handleMouseDown(event: MouseEvent) {
        if (event.button !== 0) return // Only left mouse button
        isPanning = true
        startX = event.clientX
        startY = event.clientY
        startPanX = panX
        startPanY = panY
        svgContainer.style.cursor = "grabbing"
    }

    function handleMouseMove(event: MouseEvent) {
        if (!isPanning) return
        const dx = event.clientX - startX
        const dy = event.clientY - startY
        panX = startPanX + dx
        panY = startPanY + dy
    }

    function handleMouseUp() {
        isPanning = false
        svgContainer.style.cursor = "grab"
    }

    // Handle zoom (mouse wheel)
    function handleWheel(event: WheelEvent) {
        event.preventDefault()
        const delta = -event.deltaY
        const zoomFactor = delta > 0 ? 1.1 : 0.9
        const newScale = Math.min(Math.max(scale * zoomFactor, 0.1), 20)

        // Mouse position relative to viewport (which is the transform origin at 0,0).
        const rect = viewerContainer.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top

        // Keep the content point under cursor stationary.
        // contentX = (mouseX - panX) / scale
        // newPanX = mouseX - contentX * newScale
        panX = mouseX - ((mouseX - panX) / scale) * newScale
        panY = mouseY - ((mouseY - panY) / scale) * newScale
        scale = newScale
    }

    // Export functions
    function downloadSvg() {
        const blob = new Blob([svgContent], { type: "image/svg+xml" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `mermaid-diagram-${Date.now()}.svg`
        a.click()
        URL.revokeObjectURL(url)
    }

    function downloadPng() {
        const svgBlob = new Blob([svgContent], { type: "image/svg+xml" })
        const url = URL.createObjectURL(svgBlob)
        const img = new Image()

        img.onload = () => {
            const canvas = document.createElement("canvas")
            canvas.width = img.naturalWidth * 2
            canvas.height = img.naturalHeight * 2
            const ctx = canvas.getContext("2d")
            if (!ctx) {
                URL.revokeObjectURL(url)
                return
            }
            ctx.scale(2, 2)
            ctx.drawImage(img, 0, 0)
            URL.revokeObjectURL(url)

            canvas.toBlob((blob) => {
                if (!blob) return
                const pngUrl = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = pngUrl
                a.download = `mermaid-diagram-${Date.now()}.png`
                a.click()
                URL.revokeObjectURL(pngUrl)
            }, "image/png")
        }

        img.onerror = () => {
            URL.revokeObjectURL(url)
            console.error("Failed to load SVG for PNG conversion")
        }

        img.src = url
    }

    function copySvgToClipboard() {
        navigator.clipboard
            .writeText(svgContent)
            .catch(() => console.error("Failed to copy SVG"))
    }

    function copyPngToClipboard() {
        const svgBlob = new Blob([svgContent], { type: "image/svg+xml" })
        const url = URL.createObjectURL(svgBlob)
        const img = new Image()

        img.onload = () => {
            const canvas = document.createElement("canvas")
            canvas.width = img.naturalWidth * 2
            canvas.height = img.naturalHeight * 2
            const ctx = canvas.getContext("2d")
            if (!ctx) {
                URL.revokeObjectURL(url)
                return
            }
            ctx.scale(2, 2)
            ctx.drawImage(img, 0, 0)
            URL.revokeObjectURL(url)

            canvas.toBlob((blob) => {
                if (!blob) return
                navigator.clipboard
                    .write([new ClipboardItem({ "image/png": blob })])
                    .catch(() => console.error("Failed to copy PNG"))
            }, "image/png")
        }

        img.onerror = () => {
            URL.revokeObjectURL(url)
        }

        img.src = url
    }

    // Compute transform string for the SVG
    $: transform = `translate(${panX}px, ${panY}px) scale(${scale})`
</script>

{#if open}
    <div class="mermaid-viewer-overlay">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="backdrop" on:click={closeViewer}></div>
        <div class="mermaid-viewer-modal" on:click|stopPropagation>
            <div class="viewer-header">
                <h2>Mermaid Diagram</h2>
                <div class="viewer-toolbar">
                    <button
                        class="toolbar-btn"
                        on:click={resetView}
                        title="Reset view">⟲ Reset</button
                    >
                    <button
                        class="toolbar-btn"
                        on:click={copySvgToClipboard}
                        title="Copy SVG to clipboard">📋 SVG</button
                    >
                    <button
                        class="toolbar-btn"
                        on:click={copyPngToClipboard}
                        title="Copy PNG to clipboard">🖼️ PNG</button
                    >
                    <button
                        class="toolbar-btn"
                        on:click={downloadSvg}
                        title="Download SVG file">⬇️ .svg</button
                    >
                    <button
                        class="toolbar-btn"
                        on:click={downloadPng}
                        title="Download PNG file">⬇️ .png</button
                    >
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <button
                        class="toolbar-btn close-btn"
                        on:click={closeViewer}
                        title="Close">✕</button
                    >
                </div>
            </div>
            <div
                class="viewer-viewport"
                bind:this={viewerContainer}
                on:wheel={handleWheel}
            >
                <div
                    class="svg-container"
                    bind:this={svgContainer}
                    style="transform: {transform}"
                    on:mousedown={handleMouseDown}
                    on:mousemove={handleMouseMove}
                    on:mouseup={handleMouseUp}
                    on:mouseleave={handleMouseUp}
                >
                    <div class="mermaid-svg-content">
                        {@html svgContent}
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

<style lang="scss">
    .mermaid-viewer-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        pointer-events: none;

        .backdrop {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            pointer-events: auto;
        }

        .mermaid-viewer-modal {
            position: relative;
            background: #1e1e1e;
            color: white;
            width: 90vw;
            height: 90vh;
            max-width: 1400px;
            border-radius: var(--border-radius-standard, 8px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            pointer-events: auto;
            display: flex;
            flex-direction: column;
            overflow: hidden;

            .viewer-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75em 1em;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                flex-shrink: 0;
                background: rgba(0, 0, 0, 0.3);

                h2 {
                    margin: 0;
                    padding: 0;
                    font-size: 1.1em;
                    font-weight: 600;
                }

                .viewer-toolbar {
                    display: flex;
                    gap: 6px;
                    align-items: center;

                    .toolbar-btn {
                        font-size: 12px;
                        padding: 4px 10px;
                        cursor: pointer;
                        color: var(--color-text, #ccc);
                        border-radius: 4px;
                        background-color: rgba(255, 255, 255, 0.08);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        transition: all 0.15s ease;

                        &:hover {
                            background-color: rgba(255, 255, 255, 0.15);
                            border-color: rgba(255, 255, 255, 0.2);
                        }

                        &.close-btn {
                            margin-left: 8px;
                            font-size: 14px;
                            opacity: 0.7;

                            &:hover {
                                opacity: 1;
                                background-color: rgba(255, 80, 80, 0.2);
                            }
                        }
                    }
                }
            }

            .viewer-viewport {
                flex: 1;
                overflow: hidden;
                cursor: grab;
                background: #1a1a1a;
                position: relative;
                min-height: 0;

                .svg-container {
                    position: absolute;
                    left: 0;
                    top: 0;
                    transform-origin: 0 0;
                    transition: none;

                    .mermaid-svg-content {
                        svg {
                            display: block;
                            max-width: 90vw;
                            max-height: 90vh;
                            height: auto;
                            filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
                        }
                    }
                }
            }
        }
    }

    @media (max-width: 768px) {
        .mermaid-viewer-overlay {
            .mermaid-viewer-modal {
                width: 100vw;
                height: 100vh;
                max-width: 100%;
                border-radius: 0;

                .viewer-header {
                    flex-direction: column;
                    gap: 8px;
                    align-items: flex-start;

                    .viewer-toolbar {
                        flex-wrap: wrap;
                    }
                }
            }
        }
    }
</style>
