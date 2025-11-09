<script>
    import {
        chatChopLatest,
        chatRunInference,
    } from "../../../../lib/chatSession/chatActions"
    import { currentChat } from "../../../../lib/chatSession/chatSession"
    import ContextMenu from "../../../UI/ContextMenu.svelte"
    import MarkdownEditor from "../../../components/MarkdownEditor.svelte"

    export let content = { role: "assistant", content: "" }
    export let inprogress = false
    export let isThoughts = false
    export let index
    export let onUpdatedContent = () => {}

    // Context menu state
    let contextMenuOpen = false
    let contextMenuPosition = { x: 50, y: 10 }
    let openEditor = false

    function saveAsFile() {
        const blob = new Blob([content.content], { type: `text/markdown` })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        const title = $currentChat.title ? $currentChat.title : "response"
        a.download = `${title}-fragment-${index}.md`
        a.click()
        URL.revokeObjectURL(url)
    }

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
        { name: "Save response to file", action: saveAsFile },
    ]

    function toggleContextMenu(mEvent) {
        contextMenuOpen = !contextMenuOpen

        mEvent.stopPropagation()
        mEvent.preventDefault()
    }

    function closeContextMenu() {
        contextMenuOpen = false
    }

    function copyToClipboard() {
        //navigator.clipboard.writeText(line.content)
        navigator.clipboard.writeText(content)
        closeContextMenu()
    }

    async function regenerateResponse() {
        // Remove the last assistant response and generate a new one
        chatChopLatest()
        await chatRunInference()
        closeContextMenu()
    }
</script>

{#if isThoughts}
    <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
    <details
        open
        class="response markdown bot thoughts"
        role="button"
        tabindex="0"
        class:inprogress
        data-testid="ChatLogRegular_Assistant"
    >
        <summary>&lt;THINK&gt;</summary>
        <!-- <div class="message-controls">
            <button class="dropdown" on:click={toggleContextMenu}>⋮</button>
        </div> -->
        <MarkdownEditor
            {content}
            {index}
            editorOpen={openEditor}
            {onUpdatedContent}
        />
        <!-- <ContextMenu
            open={contextMenuOpen}
            position={contextMenuPosition}
            items={menuItems}
            onClose={closeContextMenu}
        /> -->
    </details>
{:else}
    <div
        class="response markdown bot"
        role="button"
        tabindex="0"
        class:inprogress
        data-testid="ChatLogRegular_Assistant"
    >
        <div class="message-controls">
            <button class="dropdown" on:click={toggleContextMenu}>⋮</button>
        </div>
        <MarkdownEditor
            {content}
            {index}
            editorOpen={openEditor}
            {onUpdatedContent}
        />
        <ContextMenu
            open={contextMenuOpen}
            position={contextMenuPosition}
            items={menuItems}
            onClose={closeContextMenu}
        />
    </div>
{/if}

<style lang="scss">
    details.response {
        border: 1px solid red;
        margin-bottom: 1em;
        summary {
            cursor: pointer;
            opacity: 0.5;
            text-transform: uppercase;
        }
    }

    .response {
        width: auto;
        font-family: var(--font-timeline, monospace);
        line-height: 1.2;
        border-radius: var(--border-radius-standard);
        box-shadow: 0 0.25em 0.25em 0 #000;
        text-align: start;
        padding-inline: 1em;
        font-size: 1.2em;
        // background-color: var(--color-background-darker);
        background-color: #1111118a;
        color: var(--color-text-assistant);
        border-bottom: 1px solid #ffffff30;
        border-top: 1px solid #fff2;
        margin: auto;
        position: relative;
        overflow-y: clip;
        overflow-x: auto;

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

        &.thoughts {
            background-color: #2222228a;
            font-size: 0.75em;
            opacity: 0.75;
            color: var(--color-accent-complement-lighter);
            background: unset;
            border: unset;
            box-shadow: unset;
            line-height: 0.95;
            font-family: monospace;
        }
    }
</style>
