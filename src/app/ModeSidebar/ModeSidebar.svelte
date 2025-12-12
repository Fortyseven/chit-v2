<script lang="ts">
    import { modeSidebarWidth } from "$lib/appState/modeSidebarState"
    import RPModePanel from "../ChatSidebar/ModePanels/RPModePanel.svelte"

    let isResizing = false
    let startX = 0
    let startWidth = 0

    function startResize(e: MouseEvent) {
        isResizing = true
        startX = e.clientX
        startWidth = $modeSidebarWidth

        // Add global mouse event listeners
        document.addEventListener("mousemove", handleResize)
        document.addEventListener("mouseup", stopResize)

        // Prevent text selection during resize
        document.body.style.userSelect = "none"
        e.preventDefault()
    }

    function handleResize(e: MouseEvent) {
        if (!isResizing) return

        const deltaX = e.clientX - startX
        const newWidth = startWidth + deltaX

        // Set min and max width constraints
        const minWidth = 200
        const maxWidth = 600

        modeSidebarWidth.set(Math.max(minWidth, Math.min(maxWidth, newWidth)))
    }

    function stopResize() {
        isResizing = false
        document.removeEventListener("mousemove", handleResize)
        document.removeEventListener("mouseup", stopResize)
        document.body.style.userSelect = ""
    }
</script>

<div id="ModeSidebar" style="width: {$modeSidebarWidth}px;">
    <div class="panel-content">
        <RPModePanel />
    </div>
    <button
        class="resize-handle"
        aria-label="Resize sidebar"
        on:mousedown={startResize}
        class:resizing={isResizing}
    ></button>
</div>

<style lang="scss">
    #ModeSidebar {
        height: 100%;
        background-color: var(--color-background);

        position: relative;
        z-index: 50;
        min-width: 200px;
        max-width: 600px;
        overflow-y: auto;
        background: linear-gradient(to right, #161616, #000 100%);

        .panel-content {
            padding: 1rem;
        }

        .resize-handle {
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 8px;
            background: transparent;
            border: none;
            cursor: col-resize;
            z-index: 100;

            &:hover {
                background-color: var(--color-accent-complement);
                opacity: 0.3;
            }

            &.resizing {
                background-color: var(--color-accent-complement);
                opacity: 0.5;
            }

            &:focus {
                outline: 2px solid var(--color-accent-complement);
                outline-offset: -2px;
            }
        }
    }
</style>
