<script lang="ts">
    // @ts-ignore
    import { isRPMode } from "$lib/modes/modeUtils"
    import {
        extractBboxBlocks,
        injectBboxBlocks,
        renderBboxBlocksInContainer,
        type BoundingBoxEntry,
    } from "$lib/text/bboxRenderer"
    import {
        extractMermaidBlocks,
        injectMermaidBlocks,
        renderMermaidBlocksInContainer,
    } from "$lib/text/mermaidRenderer"
    import { wrapQuotesStreaming } from "$lib/text/quoteWrap"
    import { extractSvgBlocks, injectSvgBlocks } from "$lib/text/svgRenderer"
    import {
        ttsSpeak,
        ttsSpeaking,
        ttsStop,
        voiceSettings,
    } from "$lib/voice/tts"
    import katex from "katex"
    import "katex/dist/katex.min.css"
    import MarkdownIt from "markdown-it"
    import texmath from "markdown-it-texmath"
    import { createEventDispatcher, onMount, tick } from "svelte"
    // @ts-ignore
    import { hljs } from "../../vendor/highlight.min.js"
    import MermaidViewer from "./MermaidViewer.svelte"

    // Props
    export let content = ""
    export let editorOpen = false
    export let index: number
    export let onUpdatedContent = (index: number, content: string) => {}
    export let renderHtml = false
    export let sourceImage: string | null = null

    export const open = function () {
        editorOpen = true
    }

    // Event dispatcher
    const dispatch = createEventDispatcher()

    // Markdown rendering
    const md = MarkdownIt({
        html: isRPMode(),
        typographer: false,
        linkify: true,
        highlight: function (str: any, lang: any) {
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

    // Keep RP-mode quote behavior unchanged for now.
    if (!isRPMode()) {
        md.use(texmath, {
            engine: katex,
            delimiters: ["dollars", "beg_end"],
            katexOptions: {
                throwOnError: false,
            },
        })
    }

    // Component state
    let editableDiv: HTMLDivElement
    let containerEl: HTMLDivElement
    let markdownStr = ""

    // Memoization for markdown rendering (prevent re-parsing unchanged content)
    let lastContent = ""
    let lastProcessed = ""
    let lastMarkdownStr = ""
    let lastBboxBlocks: BoundingBoxEntry[][] = []
    let lastSourceImage: string | null = null
    let mounted = false

    // Mermaid viewer state
    let mermaidViewerOpen = false
    let mermaidViewerSvg = ""

    // Async render mermaid diagrams after DOM update
    async function renderMermaidDiagrams(_diagrams: string[]) {
        tick().then(() => {
            if (containerEl) {
                renderMermaidBlocksInContainer(containerEl)
            }
        })
    }

    // Re-render bbox blocks when source image becomes available after mount
    // Use tick() to wait for Svelte to update the DOM before querying elements
    $: if (mounted && containerEl && sourceImage && lastBboxBlocks.length > 0) {
        tick().then(() => {
            renderBboxBlocksInContainer(
                containerEl,
                sourceImage,
                lastBboxBlocks,
            )
        })
    }

    // Compute processed content, only show blank content
    // message when content is truly empty
    // Process content to wrap quoted sections before markdown render
    $: {
        const processed = isRPMode() ? wrapQuotesStreaming(content) : content
        // Re-render if content changed OR if sourceImage changed (for bbox overlay)
        const contentChanged =
            content !== lastContent || processed !== lastProcessed
        const sourceImageChanged = sourceImage !== lastSourceImage
        const shouldRerender =
            contentChanged || (sourceImageChanged && lastBboxBlocks.length > 0)
        if (shouldRerender) {
            lastContent = content
            lastProcessed = processed
            lastSourceImage = sourceImage
            // Always re-process full pipeline (needed when sourceImage changes
            // since we can't re-inject into already-rendered HTML)
            const { content: withoutSvg, svgBlocks } =
                extractSvgBlocks(processed)
            const { content: withoutMermaid, mermaidBlocks } =
                extractMermaidBlocks(withoutSvg)
            const { content: withoutBbox, bboxBlocks } =
                extractBboxBlocks(withoutMermaid)
            lastBboxBlocks = bboxBlocks
            const rendered = md.render(withoutBbox).trim()
            let result = injectSvgBlocks(rendered, svgBlocks)
            // Mermaid blocks are injected with loading placeholders, then rendered async
            result = injectMermaidBlocks(result, mermaidBlocks)
            result = injectBboxBlocks(result, bboxBlocks, sourceImage)
            lastMarkdownStr = result
            // Async render mermaid diagrams
            if (mermaidBlocks.length > 0) {
                renderMermaidDiagrams(mermaidBlocks)
            }
        }
        markdownStr = lastMarkdownStr
    }

    // Save the changes and update the rendered content
    function saveChanges() {
        if (editableDiv) {
            const newContent: string = editableDiv.innerText
            onUpdatedContent(index, newContent)
            content = newContent // update locally so markdownStr recomputes before editor closes
        }
        editorOpen = false
    }

    // Handle key events in the editor
    function handleKeyDown(event: KeyboardEvent) {
        // Ctrl+Enter or Cmd+Enter to save
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault()
            event.stopPropagation()
            saveChanges()
        }

        // Escape to save and close editor
        if (event.key === "Escape") {
            event.preventDefault()
            event.stopPropagation()
            saveChanges()
        }
    }

    if (editorOpen) {
        onMount(() => {
            // Set up click outside to save changes
            function handleClickOutside(event: MouseEvent) {
                if (
                    editableDiv &&
                    !editableDiv.contains(event.target as Node)
                ) {
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
        mounted = true
        // Add event listeners for copy buttons after the component is mounted
        function setupCopyButtons() {
            if (!containerEl) return
            const copyButtons = containerEl.querySelectorAll(
                ".copy-button:not([data-copy-bound])",
            )
            copyButtons.forEach((button) => {
                button.setAttribute("data-copy-bound", "1")
                button.addEventListener("click", () => {
                    const codeBlock = button.nextElementSibling
                    const code: string | undefined = codeBlock?.textContent

                    navigator.clipboard
                        .writeText(code ?? "???")
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

        function setupQuoteClickHandlers() {
            if (!isRPMode() || !containerEl) return
            const quotes = containerEl.querySelectorAll<HTMLElement>(
                ".quote:not([data-tts-bound])",
            )
            quotes.forEach((span) => {
                span.dataset.ttsBound = "1"
                span.addEventListener("click", (e) => {
                    if (!$voiceSettings.enabled) return
                    e.stopPropagation()
                    const text = span.textContent?.trim()
                    if (!text) return
                    if ($ttsSpeaking) {
                        ttsStop()
                    } else {
                        ttsSpeak(text)
                    }
                })
            })
        }

        function setupSvgCopyButtons() {
            if (!containerEl) return
            const svgCopyBtns = containerEl.querySelectorAll(
                ".svg-copy-button:not([data-copy-bound])",
            )
            svgCopyBtns.forEach((button) => {
                button.setAttribute("data-copy-bound", "1")
                button.addEventListener("click", () => {
                    const rawSvg = button.getAttribute("data-raw-svg")
                    if (!rawSvg) return
                    const decoded = rawSvg
                        .replace(/&amp;/g, "&")
                        .replace(/&lt;/g, "<")
                        .replace(/&gt;/g, ">")
                        .replace(/&quot;/g, '"')

                    navigator.clipboard
                        .writeText(decoded)
                        .then(() => {
                            const originalText = button.textContent
                            button.textContent = "✓ Copied"
                            button.classList.add("copied")
                            setTimeout(() => {
                                button.textContent = originalText
                                button.classList.remove("copied")
                            }, 2000)
                        })
                        .catch((err) => {
                            console.error("Failed to copy SVG: ", err)
                        })
                })
            })
        }

        function setupSvgPngCopyButtons() {
            if (!containerEl) return
            const pngBtns = containerEl.querySelectorAll(
                ".svg-copy-png-button:not([data-copy-bound])",
            )
            pngBtns.forEach((button) => {
                button.setAttribute("data-copy-bound", "1")
                button.addEventListener("click", () => {
                    const rawSvg = button.getAttribute("data-raw-svg")
                    if (!rawSvg) return
                    const decoded = rawSvg
                        .replace(/&amp;/g, "&")
                        .replace(/&lt;/g, "<")
                        .replace(/&gt;/g, ">")
                        .replace(/&quot;/g, '"')

                    svgToPngClipboard(decoded, button)
                })
            })
        }

        function setupBboxCopyButtons() {
            if (!containerEl) return
            const copyBtns = containerEl.querySelectorAll(
                ".bbox-copy-button:not([data-bbox-bound])",
            )
            copyBtns.forEach((button) => {
                button.setAttribute("data-bbox-bound", "1")
                button.addEventListener("click", () => {
                    const wrapper = button.closest(".bbox-block-wrapper")
                    const dataUrl = wrapper?.getAttribute("data-annotated-url")
                    if (!dataUrl) return

                    // Convert data URL to blob and copy to clipboard
                    fetch(dataUrl)
                        .then((res) => res.blob())
                        .then((blob) => {
                            navigator.clipboard
                                .write([
                                    new ClipboardItem({ "image/png": blob }),
                                ])
                                .then(() => {
                                    const originalText = button.textContent
                                    button.textContent = "✓ Copied"
                                    button.classList.add("copied")
                                    setTimeout(() => {
                                        button.textContent = originalText
                                        button.classList.remove("copied")
                                    }, 2000)
                                })
                                .catch((err) => {
                                    console.error(
                                        "Failed to copy bbox image:",
                                        err,
                                    )
                                })
                        })
                        .catch((err) => {
                            console.error("Failed to fetch bbox image:", err)
                        })
                })
            })
        }

        function setupBboxDownloadButtons() {
            if (!containerEl) return
            const downloadBtns = containerEl.querySelectorAll(
                ".bbox-download-button:not([data-bbox-bound])",
            )
            downloadBtns.forEach((button) => {
                button.setAttribute("data-bbox-bound", "1")
                button.addEventListener("click", () => {
                    const wrapper = button.closest(".bbox-block-wrapper")
                    const dataUrl = wrapper?.getAttribute("data-annotated-url")
                    if (!dataUrl) return

                    const a = document.createElement("a")
                    a.href = dataUrl
                    a.download = `annotated-image-${Date.now()}.png`
                    a.click()
                })
            })
        }

        function setupBboxToggleButtons() {
            if (!containerEl) return
            const toggleBtns = containerEl.querySelectorAll(
                ".bbox-toggle-button:not([data-bbox-bound])",
            )
            toggleBtns.forEach((button) => {
                button.setAttribute("data-bbox-bound", "1")
                button.addEventListener("click", () => {
                    const wrapper = button.closest(".bbox-block-wrapper")
                    if (!wrapper) return
                    const contentEl = wrapper.querySelector(
                        ".bbox-block-content",
                    )
                    const rawJsonEl = wrapper.querySelector(".bbox-raw-json")
                    if (!contentEl || !rawJsonEl) return

                    const isShowingJson = rawJsonEl.style.display !== "none"
                    if (isShowingJson) {
                        // Switch back to image
                        contentEl.style.display = ""
                        rawJsonEl.style.display = "none"
                        button.textContent = "📄 Show JSON"
                    } else {
                        // Show raw JSON
                        const jsonStr = rawJsonEl.getAttribute("data-json")
                        if (jsonStr) {
                            rawJsonEl.innerHTML = `<pre>${jsonStr}</pre>`
                        }
                        contentEl.style.display = "none"
                        rawJsonEl.style.display = ""
                        button.textContent = "🖼️ Show Image"
                    }
                })
            })
        }

        function setupMermaidButtons() {
            if (!containerEl) return
            // Expand button — open mermaid viewer modal
            const expandBtns = containerEl.querySelectorAll(
                ".mermaid-expand-button:not([data-mermaid-bound])",
            )
            expandBtns.forEach((button) => {
                button.setAttribute("data-mermaid-bound", "1")
                button.addEventListener("click", () => {
                    const wrapper = button.closest(".mermaid-block-wrapper")
                    if (!wrapper) return
                    const svg = wrapper.getAttribute("data-mermaid-svg")
                    if (!svg) return
                    const decoded = svg
                        .replace(/&amp;/g, "&")
                        .replace(/&lt;/g, "<")
                        .replace(/&gt;/g, ">")
                        .replace(/&quot;/g, '"')
                    mermaidViewerSvg = decoded
                    mermaidViewerOpen = true
                })
            })

            // Copy SVG button
            const copySvgBtns = containerEl.querySelectorAll(
                ".mermaid-copy-svg-button:not([data-mermaid-bound])",
            )
            copySvgBtns.forEach((button) => {
                button.setAttribute("data-mermaid-bound", "1")
                button.addEventListener("click", () => {
                    const wrapper = button.closest(".mermaid-block-wrapper")
                    if (!wrapper) return
                    const svg = wrapper.getAttribute("data-mermaid-svg")
                    if (!svg) return
                    const decoded = svg
                        .replace(/&amp;/g, "&")
                        .replace(/&lt;/g, "<")
                        .replace(/&gt;/g, ">")
                        .replace(/&quot;/g, '"')
                    navigator.clipboard
                        .writeText(decoded)
                        .then(() => {
                            const originalText = button.textContent
                            button.textContent = "✓ Copied"
                            button.classList.add("copied")
                            setTimeout(() => {
                                button.textContent = originalText
                                button.classList.remove("copied")
                            }, 2000)
                        })
                        .catch((err) => {
                            console.error("Failed to copy SVG:", err)
                        })
                })
            })

            // Copy PNG button
            const copyPngBtns = containerEl.querySelectorAll(
                ".mermaid-copy-png-button:not([data-mermaid-bound])",
            )
            copyPngBtns.forEach((button) => {
                button.setAttribute("data-mermaid-bound", "1")
                button.addEventListener("click", () => {
                    const wrapper = button.closest(".mermaid-block-wrapper")
                    if (!wrapper) return
                    const svg = wrapper.getAttribute("data-mermaid-svg")
                    if (!svg) return
                    const decoded = svg
                        .replace(/&amp;/g, "&")
                        .replace(/&lt;/g, "<")
                        .replace(/&gt;/g, ">")
                        .replace(/&quot;/g, '"')
                    svgToPngClipboard(decoded, button)
                })
            })

            // Download SVG button
            const downloadSvgBtns = containerEl.querySelectorAll(
                ".mermaid-download-svg-button:not([data-mermaid-bound])",
            )
            downloadSvgBtns.forEach((button) => {
                button.setAttribute("data-mermaid-bound", "1")
                button.addEventListener("click", () => {
                    const wrapper = button.closest(".mermaid-block-wrapper")
                    if (!wrapper) return
                    const svg = wrapper.getAttribute("data-mermaid-svg")
                    if (!svg) return
                    const decoded = svg
                        .replace(/&amp;/g, "&")
                        .replace(/&lt;/g, "<")
                        .replace(/&gt;/g, ">")
                        .replace(/&quot;/g, '"')
                    const blob = new Blob([decoded], { type: "image/svg+xml" })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `mermaid-diagram-${Date.now()}.svg`
                    a.click()
                    URL.revokeObjectURL(url)
                })
            })

            // Download PNG button
            const downloadPngBtns = containerEl.querySelectorAll(
                ".mermaid-download-png-button:not([data-mermaid-bound])",
            )
            downloadPngBtns.forEach((button) => {
                button.setAttribute("data-mermaid-bound", "1")
                button.addEventListener("click", () => {
                    const wrapper = button.closest(".mermaid-block-wrapper")
                    if (!wrapper) return
                    const svg = wrapper.getAttribute("data-mermaid-svg")
                    if (!svg) return
                    const decoded = svg
                        .replace(/&amp;/g, "&")
                        .replace(/&lt;/g, "<")
                        .replace(/&gt;/g, ">")
                        .replace(/&quot;/g, '"')

                    const svgBlob = new Blob([decoded], {
                        type: "image/svg+xml",
                    })
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
                    img.src = url
                })
            })

            // Click on diagram content to expand
            const contentEls = containerEl.querySelectorAll(
                ".mermaid-block-content:not([data-mermaid-bound])",
            )
            contentEls.forEach((el) => {
                el.setAttribute("data-mermaid-bound", "1")
                el.addEventListener("click", () => {
                    const wrapper = el.closest(".mermaid-block-wrapper")
                    if (!wrapper) return
                    const svg = wrapper.getAttribute("data-mermaid-svg")
                    if (!svg) return
                    const decoded = svg
                        .replace(/&amp;/g, "&")
                        .replace(/&lt;/g, "<")
                        .replace(/&gt;/g, ">")
                        .replace(/&quot;/g, '"')
                    mermaidViewerSvg = decoded
                    mermaidViewerOpen = true
                })
            })
        }

        /**
         * Renders SVG to a canvas and copies as PNG to clipboard.
         */
        function svgToPngClipboard(svgSource: string, button: Element) {
            const svgBlob = new Blob([svgSource], {
                type: "image/svg+xml;charset=utf-8",
            })
            const url = URL.createObjectURL(svgBlob)
            const img = new Image()

            img.onload = () => {
                const scale = 2
                const canvas = document.createElement("canvas")
                canvas.width = img.naturalWidth * scale
                canvas.height = img.naturalHeight * scale
                const ctx = canvas.getContext("2d")
                if (!ctx) {
                    URL.revokeObjectURL(url)
                    return
                }
                ctx.scale(scale, scale)
                ctx.drawImage(img, 0, 0)
                URL.revokeObjectURL(url)

                canvas.toBlob((blob) => {
                    if (!blob) return
                    navigator.clipboard
                        .write([new ClipboardItem({ "image/png": blob })])
                        .then(() => {
                            const originalText = button.textContent
                            button.textContent = "✓ Copied"
                            button.classList.add("copied")
                            setTimeout(() => {
                                button.textContent = originalText
                                button.classList.remove("copied")
                            }, 2000)
                        })
                        .catch((err) => {
                            console.error("Failed to copy PNG: ", err)
                        })
                }, "image/png")
            }

            img.onerror = () => {
                URL.revokeObjectURL(url)
                console.error("Failed to load SVG for PNG conversion")
            }

            img.src = url
        }

        // Initial setup
        setupCopyButtons()
        setupQuoteClickHandlers()
        setupSvgCopyButtons()
        setupSvgPngCopyButtons()
        setupBboxCopyButtons()
        setupBboxDownloadButtons()
        setupBboxToggleButtons()
        setupMermaidButtons()

        // Render bbox blocks asynchronously after initial setup
        if (sourceImage && lastBboxBlocks.length > 0 && containerEl) {
            renderBboxBlocksInContainer(
                containerEl,
                sourceImage,
                lastBboxBlocks,
            )
        }

        // Set up a mutation observer scoped to this component's container
        const observer = new MutationObserver(() => {
            setupCopyButtons()
            setupQuoteClickHandlers()
            setupSvgCopyButtons()
            setupSvgPngCopyButtons()
            setupBboxCopyButtons()
            setupBboxDownloadButtons()
            setupBboxToggleButtons()
            setupMermaidButtons()
        })
        observer.observe(containerEl, { childList: true, subtree: true })

        return () => {
            observer.disconnect()
        }
    })
</script>

<div class="markdown-editor" bind:this={containerEl}>
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
            {#if !isRPMode() && renderHtml}
                {@html content.trim()}
            {:else}
                {@html markdownStr}
            {/if}
        </div>
    {/if}
</div>

<MermaidViewer bind:open={mermaidViewerOpen} svgContent={mermaidViewerSvg} />

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

        :global(.katex-display) {
            overflow-x: auto;
            overflow-y: hidden;
            padding: 0.2em 0;
        }

        :global(.katex-display > .katex) {
            max-width: 100%;
        }

        :global(.katex) {
            font-size: 1.02em;
        }

        :global(.svg-block-wrapper) {
            position: relative;
            margin: 1em 0;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: var(--border-radius-standard);
            overflow: hidden;
            background-color: var(--color-background-darkest);
        }

        :global(.svg-block-toolbar) {
            display: flex;
            justify-content: flex-end;
            padding: 4px 8px;
            background-color: rgba(255, 255, 255, 0.05);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        :global(.svg-copy-button),
        :global(.svg-copy-png-button) {
            font-size: 12px;
            padding: 2px 8px;
            cursor: pointer;
            opacity: 0.6;
            transition: opacity 0.2s ease;
            color: var(--color-text);
            border-radius: 3px;
            background-color: rgba(255, 255, 255, 0.08);

            &:hover {
                opacity: 1;
            }

            &.copied {
                background-color: rgba(50, 205, 50, 0.3);
                opacity: 1;
            }
        }

        :global(.svg-block-content) {
            display: flex;
            justify-content: center;
            padding: 1em;
            overflow-x: auto;

            :global(svg) {
                max-width: 100%;
                height: auto;
            }
        }

        :global(.quote) {
            color: #fff;
            font-family: var(--font-quoted, monospace);
            filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
            cursor: pointer;
            border-radius: 2px;
            transition:
                background-color 0.15s ease,
                color 0.15s ease;

            &:hover {
                background-color: rgba(255, 255, 255, 0.12);
                color: var(--color-accent, #fff);
            }

            &:active {
                background-color: rgba(255, 255, 255, 0.22);
            }
        }

        :global(.bbox-block-wrapper) {
            position: relative;
            margin: 1em 0;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: var(--border-radius-standard);
            overflow: hidden;
            background-color: var(--color-background-darkest);
        }

        :global(.bbox-block-toolbar) {
            display: flex;
            justify-content: flex-end;
            gap: 4px;
            padding: 4px 8px;
            background-color: rgba(255, 255, 255, 0.05);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        :global(.bbox-copy-button),
        :global(.bbox-download-button),
        :global(.bbox-toggle-button) {
            font-size: 12px;
            padding: 2px 8px;
            cursor: pointer;
            opacity: 0.6;
            transition: opacity 0.2s ease;
            color: var(--color-text);
            border-radius: 3px;
            background-color: rgba(255, 255, 255, 0.08);

            &:hover {
                opacity: 1;
            }

            &.copied {
                background-color: rgba(50, 205, 50, 0.3);
                opacity: 1;
            }
        }

        :global(.bbox-block-content) {
            display: flex;
            justify-content: center;
            padding: 1em;
            overflow-x: auto;

            :global(.bbox-annotated-image) {
                max-width: 100%;
                height: auto;
                border-radius: 4px;
            }
        }

        :global(.bbox-loading) {
            color: var(--color-text);
            opacity: 0.5;
            padding: 2em;
            text-align: center;
        }

        :global(.bbox-no-image) {
            color: var(--color-text);
            opacity: 0.6;
            padding: 2em;
            text-align: center;
            background-color: rgba(255, 255, 255, 0.03);
            border-radius: 4px;
            margin: 1em;
        }

        :global(.bbox-error) {
            color: #ff6b6b;
            padding: 2em;
            text-align: center;
        }

        :global(.bbox-raw-json) {
            padding: 1em;
            background-color: rgba(0, 0, 0, 0.3);

            :global(pre) {
                margin: 0;
                font-family: monospace;
                font-size: 12px;
                white-space: pre-wrap;
                word-break: break-all;
                color: var(--color-text);
            }
        }

        :global(.mermaid-block-wrapper) {
            position: relative;
            margin: 1em 0;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: var(--border-radius-standard);
            overflow: hidden;
            background-color: var(--color-background-darkest);
        }

        :global(.mermaid-block-toolbar) {
            display: flex;
            justify-content: flex-end;
            gap: 4px;
            padding: 4px 8px;
            background-color: rgba(255, 255, 255, 0.05);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            flex-wrap: wrap;
        }

        :global(.mermaid-expand-button),
        :global(.mermaid-copy-svg-button),
        :global(.mermaid-copy-png-button),
        :global(.mermaid-download-svg-button),
        :global(.mermaid-download-png-button) {
            font-size: 12px;
            padding: 2px 8px;
            cursor: pointer;
            opacity: 0.6;
            transition: opacity 0.2s ease;
            color: var(--color-text);
            border-radius: 3px;
            background-color: rgba(255, 255, 255, 0.08);

            &:hover {
                opacity: 1;
            }

            &.copied {
                background-color: rgba(50, 205, 50, 0.3);
                opacity: 1;
            }
        }

        :global(.mermaid-block-content) {
            display: flex;
            justify-content: center;
            padding: 1em;
            overflow-x: auto;
            cursor: pointer;

            :global(svg) {
                max-width: 100%;
                height: auto;
            }
        }

        :global(.mermaid-loading) {
            color: var(--color-text);
            opacity: 0.5;
            padding: 2em;
            text-align: center;
        }

        :global(.mermaid-error) {
            color: #ff6b6b;
            padding: 2em;
            text-align: center;
        }
    }
</style>
