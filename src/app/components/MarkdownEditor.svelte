<script>
    import MarkdownIt from "markdown-it"
    import { createEventDispatcher, onMount } from "svelte"
    import { isRPMode } from "../../lib/modes/modeUtils"
    import { wrapQuotesStreaming } from "../../lib/text/quoteWrap"
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
        html: true,
        highlight: function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return (
                        '<pre class="code-block-wrapper"><div class="copy-button" title="Copy to clipboard">📋</div><code class="hljs">' +
                        hljs.highlight(str, {
                            language: lang,
                            ignoreIllegals: true,
                        }).value +
                        "</code></pre>"
                    )
                } catch (__) {}
            }

            return (
                '<pre class="code-block-wrapper"><div class="copy-button" title="Copy to clipboard">📋</div><code class="hljs">' +
                md.utils.escapeHtml(str) +
                "</code></pre>"
            )
        },
    })

    // Component state
    let isEditing = false
    let editableDiv
    let markdownStr = ""

    // Compute processed content, only show blank content
    // message when content is truly empty
    // Process content to wrap quoted sections before markdown render
    $: {
        const processed = isRPMode() ? wrapQuotesStreaming(content) : content
        markdownStr = md.render(processed).trim()
    }

    // Save the changes and update the rendered content
    function saveChanges() {
        if (editableDiv) {
            const newContent = editableDiv.innerText
            if (newContent !== content) {
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

    onMount(() => {
        // Add event listeners for copy buttons after the component is mounted
        function setupCopyButtons() {
            const copyButtons = document.querySelectorAll(".copy-button")
            copyButtons.forEach((button) => {
                button.addEventListener("click", () => {
                    const codeBlock = button.nextElementSibling
                    const code = codeBlock.textContent

                    navigator.clipboard
                        .writeText(code)
                        .then(() => {
                            // Show feedback
                            const originalText = button.textContent
                            button.textContent = "✓"
                            button.classList.add("copied")

                            setTimeout(() => {
                                button.textContent = originalText
                                button.classList.remove("copied")
                            }, 2000)
                        })
                        .catch((err) => {
                            console.error("Failed to copy: ", err)
                        })
                })
            })
        }

        // Initial setup
        setupCopyButtons()

        // Set up a mutation observer to detect when new code blocks are added
        const observer = new MutationObserver(setupCopyButtons)
        observer.observe(document.body, { childList: true, subtree: true })

        return () => {
            observer.disconnect()
        }
    })
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

        :global(pre.code-block-wrapper) {
            position: relative;
            overflow-x: auto;
            background-color: var(--color-background-darkest);
            padding: 0.5em;
            border-radius: var(--border-radius-standard);
        }

        :global(.copy-button) {
            position: absolute;
            top: 15px;
            right: 15px;
            background-color: rgba(255, 255, 255, 0.1);
            // border-radius: 4px;
            padding: 4px 8px;
            font-size: 14px;
            cursor: pointer;
            opacity: 0.5;
            transition: opacity 0.2s ease;
            z-index: 10;

            &:hover {
                opacity: 1;
            }

            &.copied {
                background-color: rgba(50, 205, 50, 0.3);
            }
        }

        :global(code) {
            font-family: monospace;
        }

        :global(.quote) {
            color: white;
            font-family: serif;
        }
    }
</style>
