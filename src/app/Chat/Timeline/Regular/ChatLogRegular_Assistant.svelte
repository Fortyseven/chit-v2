<script>
    import { onMount } from "svelte"
    import {
        chatChopLatest,
        chatRunInference,
    } from "../../../../lib/chatSession/chatActions"
    import MarkdownEditor from "../../../components/MarkdownEditor.svelte"

    export let line = { role: "assistant", content: "" }
    export let inprogress = false
    export let index
    export let onUpdatedContent = () => {}

    // Context menu state
    let contextMenuOpen = false
    let contextMenuPosition = { x: 0, y: 0 }
    let openEditor = false

    // Context menu actions
    const menuItems = [
        { name: "Copy response", action: () => copyToClipboard() },
        {
            name: "Regenerate response",
            action: () => regenerateResponse(),
        },
        { name: "-" }, // Separator
        { name: "Edit message", action: () => (openEditor = true) },
        { name: "-" }, // Separator
        { name: "Save response as markdown", action: () => saveAsFile("md") },
        { name: "Save response as text", action: () => saveAsFile("txt") },
    ]

    function toggleContextMenu(event) {
        event.stopPropagation()
        event.preventDefault()
        contextMenuOpen = !contextMenuOpen
        if (contextMenuOpen) {
            const mouseX = event.clientX
            const mouseY = event.clientY

            let xOffset = 0

            if (mouseX > window.innerWidth / 2) {
                xOffset = -180
            }

            contextMenuPosition = {
                x: mouseX + xOffset,
                y: mouseY,
            }
        }
    }

    function closeContextMenu() {
        contextMenuOpen = false
    }

    function copyToClipboard() {
        navigator.clipboard.writeText(line)
        closeContextMenu()
    }

    function regenerateResponse() {
        // Remove the last assistant response and generate a new one
        chatChopLatest()
        chatRunInference()
        closeContextMenu()
    }

    onMount(() => {
        // Close menu when clicking outside
        function handleClickOutside(event) {
            const menu = document.querySelector(".context-menu")
            const button = document.querySelector(".dropdown")
            if (
                contextMenuOpen &&
                menu &&
                !menu.contains(event.target) &&
                button &&
                !button.contains(event.target)
            ) {
                closeContextMenu()
            }
        }

        // Close menu when pressing Escape
        function handleEscapeKey(event) {
            if (contextMenuOpen && event.key === "Escape") {
                closeContextMenu()
            }
        }

        document.addEventListener("click", handleClickOutside)
        document.addEventListener("keydown", handleEscapeKey)

        return () => {
            document.removeEventListener("click", handleClickOutside)
            document.removeEventListener("keydown", handleEscapeKey)
        }
    })
</script>

<!-- on:contextmenu={toggleContextMenu} -->
<div class="response markdown bot" role="button" tabindex="0" class:inprogress>
    <div class="message-controls">
        <button class="dropdown" on:click={toggleContextMenu}>⋮</button>
    </div>

    <MarkdownEditor
        content={line}
        {index}
        editorOpen={openEditor}
        {onUpdatedContent}
    />

    {#if contextMenuOpen}
        <div
            class="context-menu"
            style="position: fixed; left: {contextMenuPosition.x}px; top: {contextMenuPosition.y}px;"
        >
            {#each menuItems as item}
                {#if item.name === "-"}
                    <hr />
                {:else}
                    <button on:click={item.action}>{item.name}</button>
                {/if}
            {/each}
        </div>
    {/if}
</div>

<style lang="scss">
    .response {
        width: auto;
        font-family: Barlow, Ubuntu;
        line-height: 1.2;
        border-radius: var(--border-radius-standard);
        box-shadow: 0 0.25em 0.25em 0 #000;
        text-align: start;
        padding-inline: 1em;
        font-size: 1.2em;
        background-color: var(--color-background-darker);
        color: var(--color-text-assistant);
        border-bottom: 1px solid #ffffff30;
        border-top: 1px solid #fff2;
        margin: auto;
        position: relative;
        overflow-y: clip;
        overflow-x: scroll;

        &.inprogress {
            //
        }

        .message-controls {
            position: absolute;
            top: 0.5em;
            right: 0.5em;
            opacity: 0.25;
            transition: opacity 0.2s ease-in-out;
            z-index: 10;

            &:hover {
                opacity: 1;
            }

            button.dropdown {
                background: transparent;
                color: var(--color-accent);
                font-size: 1.25em;
                font-weight: bold;
                padding: 0.2em 0.5em;
                border-radius: var(--border-radius-standard);
                cursor: pointer;

                &:hover {
                    background-color: var(--color-background-lighter);
                }
            }
        }

        pre {
            overflow: scroll;
        }
    }

    .context-menu {
        background-color: var(--color-background);
        border-radius: var(--border-radius-standard);
        box-shadow: 0 0 10px black;
        z-index: 1000;
        padding: 0;
        font-size: 0.75em;
        padding-block: 0.5em;

        button {
            background: transparent;
            color: var(--color-accent);
            margin: 0;
            padding-block: 0.25em;
            display: block;
            width: 100%;
            text-align: left;
            font-weight: unset;

            &:hover {
                background-color: var(--color-accent);
                color: var(--color-accent-text);
            }
        }

        hr {
            border: none;
            border-top: 1px solid var(--color-accent-complement-darker);
            opacity: 0.5;
            margin: 0.5em 1em !important;
        }
    }
</style>
