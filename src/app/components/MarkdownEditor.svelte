<script>
    import MarkdownIt from "markdown-it"
    import { createEventDispatcher, onMount } from "svelte"
    import { hljs } from "../../vendor/highlight.min.js"

    // Props
    export let content = ""
    export let editorOpen = false
    export let index
    export let onUpdatedContent = (content) => {}

    export let open = function () {
        openEditor = true
    }

    // Event dispatcher
    const dispatch = createEventDispatcher()

    // Markdown rendering
    const md = MarkdownIt({
        highlight: function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    const hl = hljs.highlight(str, { language: lang }).value
                    return hl
                } catch (__) {}
            }
            return "" // use external default escaping
        },
    })

    // Component state
    let isEditing = false
    let editableDiv
    let processedContent
    let markdownStr = ""

    // Compute processed content, only show blank content message when content is truly empty
    $: {
        // Make sure content is a string and has actual content before rendering
        // contentStr = content
        // content != null && content !== undefined ? String(content) : ""

        // const isEmpty = contentStr.trim() === ""

        // Only show blank content message if truly empty (not "", "0", etc)
        // processedContent =
        // isEmpty && contentStr !== "0" && contentStr !== "false"
        // ? md.render("_[blank content]_").trim()
        // :

        markdownStr = md.render(content).trim()
    }

    // // Toggle between viewing and editing modes
    // function toggleEditMode() {
    //     if (!editable) return

    //     isEditing = !isEditing

    //     if (isEditing) {
    //         setTimeout(() => {
    //             if (editableDiv) {
    //                 editableDiv.innerText =
    //                     content !== null && content !== undefined
    //                         ? String(content)
    //                         : ""
    //                 editableDiv.focus()
    //             }
    //         }, 0)
    //     } else {
    //         // When exiting edit mode, update the content with edited text
    //         saveChanges()
    //     }
    // }

    // Save the changes and update the rendered content
    function saveChanges() {
        if (editableDiv) {
            const newContent = editableDiv.innerText
            if (newContent !== content) {
                // content = newContent
                // dispatch("change", { content })
                onUpdatedContent(index, newContent)
            }
        }
        isEditing = false
    }

    // Handle key events in the editor
    function handleKeyDown(event) {
        // Ctrl+Enter or Cmd+Enter to save
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault()
            saveChanges()
        }

        // Escape to cancel editing
        if (event.key === "Escape") {
            event.preventDefault()
            isEditing = false
            saveChanges()
        }
    }

    if (editorOpen) {
        onMount(() => {
            // Set up click outside to save changes
            function handleClickOutside(event) {
                if (editableDiv && !editableDiv.contains(event.target)) {
                    saveChanges()
                }
            }

            document.addEventListener("click", handleClickOutside)

            return () => {
                document.removeEventListener("click", handleClickOutside)
            }
        })
    }
</script>

<div class="markdown-editor">
    {#if editorOpen}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="editor-input"
            contenteditable={true}
            bind:this={editableDiv}
            on:keydown={handleKeyDown}
        >
            {#if content}
                {@html content}
            {:else}
                <span class="placeholder">_[blank content]_</span>
            {/if}
        </div>
    {:else}
        <div class="rendered-content">
            {@html markdownStr}
        </div>
    {/if}
</div>

<style lang="scss">
    .markdown-editor {
        width: 100%;
        height: 100%;
        position: relative;
    }

    .editor-input {
        width: 100%;
        min-height: 100px;
        border: 1px solid var(--color-accent);
        border-radius: var(--border-radius-standard);
        padding: 0.5em;
        background-color: var(--color-background-lighter);
        color: var(--color-text);
        font-family: monospace;
        white-space: pre-wrap;
        overflow-y: auto;
        outline: none;
    }

    .rendered-content {
        width: 100%;
        min-height: 100%;

        :global(pre) {
            overflow-x: auto;
            background-color: var(--color-background-darkest);
            padding: 0.5em;
            border-radius: var(--border-radius-standard);
        }

        :global(code) {
            font-family: monospace;
        }
    }
</style>
