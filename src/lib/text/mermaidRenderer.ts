import DOMPurify from "dompurify"
import mermaid from "mermaid"

// Use a plain-text placeholder that markdown-it won't escape or transform
const MERMAID_PLACEHOLDER_PREFIX = "MERMAIDBLOCK_"
const MERMAID_PLACEHOLDER_SUFFIX = "_ENDMERMAIDBLOCK"

// Initialize mermaid with safe defaults
mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "dark",
    fontFamily: "var(--font-family, sans-serif)",
})

/**
 * Extracts Mermaid diagram blocks from content, replacing them with placeholders.
 * Handles mermaid code fences (```mermaid).
 * Returns the modified content and an array of raw mermaid strings.
 */
export function extractMermaidBlocks(content: string): {
    content: string
    mermaidBlocks: string[]
} {
    const mermaidBlocks: string[] = []

    // Extract mermaid from code fences (```mermaid)
    const mermaidRegex = /```mermaid\s*\n([\s\S]*?)\n```/gi
    const modified = content.replace(mermaidRegex, (_match, diagramContent) => {
        const index = mermaidBlocks.length
        mermaidBlocks.push(diagramContent.trim())
        return `${MERMAID_PLACEHOLDER_PREFIX}${index}${MERMAID_PLACEHOLDER_SUFFIX}`
    })

    return { content: modified, mermaidBlocks }
}

/**
 * Renders a mermaid diagram string to an SVG string.
 * Returns null if rendering fails.
 */
export async function renderMermaidToSvg(
    diagram: string,
): Promise<{ svg: string; diagram: string } | null> {
    try {
        const { svg } = await mermaid.render(`mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, diagram)
        return { svg, diagram }
    } catch (err) {
        console.error("Mermaid rendering failed:", err)
        return null
    }
}

/**
 * Sanitizes an SVG string using DOMPurify (reuses the same allowlist as SVG renderer).
 */
function sanitizeSvg(rawSvg: string): string {
    return DOMPurify.sanitize(rawSvg, {
        ADD_TAGS: [
            "svg", "g", "path", "circle", "ellipse", "rect", "line",
            "polyline", "polygon", "text", "tspan", "textPath", "defs",
            "clipPath", "mask", "pattern", "image", "use", "symbol",
            "linearGradient", "radialGradient", "stop", "filter",
            "feGaussianBlur", "feOffset", "feMerge", "feMergeNode",
            "feFlood", "feComposite", "feBlend", "feColorMatrix",
            "marker", "animate", "animateTransform", "title", "desc",
        ],
        ADD_ATTR: [
            "viewBox", "xmlns", "xmlns:xlink", "fill", "stroke",
            "stroke-width", "stroke-linecap", "stroke-linejoin",
            "stroke-dasharray", "stroke-dashoffset", "stroke-opacity",
            "fill-opacity", "opacity", "transform", "d", "cx", "cy",
            "r", "rx", "ry", "x", "y", "x1", "y1", "x2", "y2",
            "width", "height", "points", "font-size", "font-family",
            "font-weight", "text-anchor", "dominant-baseline",
            "alignment-baseline", "dx", "dy", "rotate",
            "gradientUnits", "gradientTransform", "offset",
            "stop-color", "stop-opacity", "clip-path", "mask",
            "filter", "id", "class", "style", "preserveAspectRatio",
            "href", "xlink:href", "patternUnits", "patternTransform",
            "markerWidth", "markerHeight", "refX", "refY", "orient",
            "visibility", "display", "color",
        ],
        FORBID_TAGS: ["script", "foreignObject", "iframe", "object", "embed"],
        FORBID_ATTR: [
            "onload", "onerror", "onclick", "onmouseover", "onmouseout",
            "onfocus", "onblur", "onanimationend", "onanimationstart",
        ],
    })
}

/**
 * Replaces Mermaid placeholders in rendered HTML with wrapped blocks containing
 * the raw diagram source in data attributes. Rendering happens asynchronously.
 * The blocks initially show a loading state, then get updated by renderMermaidBlocksInContainer.
 */
export function injectMermaidBlocks(
    html: string,
    mermaidDiagrams: string[],
): string {
    if (mermaidDiagrams.length === 0) return html

    return html.replace(
        /(?:<p>)?MERMAIDBLOCK_(\d+)_ENDMERMAIDBLOCK(?:<\/p>)?/g,
        (_match, indexStr) => {
            const index = parseInt(indexStr, 10)
            const diagram = mermaidDiagrams[index]
            if (!diagram) return ""

            // Encode the diagram source for data attributes (HTML attribute safe)
            const escapedDiagram = diagram
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")

            return (
                `<div class="mermaid-block-wrapper" data-mermaid-diagram="${escapedDiagram}">` +
                `<div class="mermaid-block-toolbar">` +
                `<div class="mermaid-source-button" title="Toggle diagram source">📄 Source</div>` +
                `<div class="mermaid-expand-button" title="Open in full viewer">🔍 Expand</div>` +
                `<div class="mermaid-copy-svg-button" title="Copy as SVG">📋 SVG</div>` +
                `<div class="mermaid-copy-png-button" title="Copy as PNG">🖼️ PNG</div>` +
                `<div class="mermaid-download-svg-button" title="Download SVG file">⬇️ .svg</div>` +
                `<div class="mermaid-download-png-button" title="Download PNG file">⬇️ .png</div>` +
                `</div>` +
                `<div class="mermaid-block-content">` +
                `<div class="mermaid-loading">Loading diagram...</div>` +
                `</div>` +
                `</div>`
            )
        },
    )
}

/**
 * Asynchronously renders all mermaid blocks in a container.
 * Called after the DOM is updated with injectMermaidBlocks placeholders.
 */
export async function renderMermaidBlocksInContainer(
    container: HTMLElement,
): Promise<void> {
    const wrappers = container.querySelectorAll<HTMLElement>(
        ".mermaid-block-wrapper[data-mermaid-diagram]:not([data-mermaid-rendered])",
    )

    for (const wrapper of wrappers) {
        const diagram = wrapper.getAttribute("data-mermaid-diagram")
        if (!diagram) continue

        // Decode HTML entities back to original
        const decodedDiagram = diagram
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')

        const result = await renderMermaidToSvg(decodedDiagram)
        const contentEl = wrapper.querySelector(".mermaid-block-content")
        if (!contentEl) continue

        if (result) {
            wrapper.setAttribute("data-mermaid-rendered", "1")
            // Store the rendered SVG in a data attribute for button handlers
            const escapedSvg = result.svg
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
            wrapper.setAttribute("data-mermaid-svg", escapedSvg)

            contentEl.innerHTML = sanitizeSvg(result.svg)
        } else {
            wrapper.setAttribute("data-mermaid-rendered", "1")
            contentEl.innerHTML = `<div class="mermaid-error">Failed to render diagram</div>`
        }
    }
}