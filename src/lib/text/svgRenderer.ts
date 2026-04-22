import DOMPurify from "dompurify"

// Use a plain-text placeholder that markdown-it won't escape or transform
const SVG_PLACEHOLDER_PREFIX = "SVGBLOCK_"
const SVG_PLACEHOLDER_SUFFIX = "_ENDSVGBLOCK"

/**
 * Extracts raw SVG blocks from content, replacing them with placeholders.
 * Handles both bare <svg> tags and SVG wrapped in markdown code fences.
 * Returns the modified content and an array of raw SVG strings.
 */
export function extractSvgBlocks(content: string): {
    content: string
    svgBlocks: string[]
} {
    const svgBlocks: string[] = []

    // First, extract SVG from markdown code fences (```svg, ```xml, ```html, or bare ```)
    const fencedSvgRegex = /```(?:svg|xml|html)?\s*\n(<svg[\s>][\s\S]*?<\/svg>)\s*\n```/gi
    let modified = content.replace(fencedSvgRegex, (_match, svgContent) => {
        const index = svgBlocks.length
        svgBlocks.push(svgContent)
        return `${SVG_PLACEHOLDER_PREFIX}${index}${SVG_PLACEHOLDER_SUFFIX}`
    })

    // Then, extract bare <svg> blocks not in fences
    const bareSvgRegex = /<svg[\s>][\s\S]*?<\/svg>/gi
    modified = modified.replace(bareSvgRegex, (match) => {
        const index = svgBlocks.length
        svgBlocks.push(match)
        return `${SVG_PLACEHOLDER_PREFIX}${index}${SVG_PLACEHOLDER_SUFFIX}`
    })

    return { content: modified, svgBlocks }
}

/**
 * Sanitizes an SVG string using DOMPurify, allowing only safe SVG elements and attributes.
 */
export function sanitizeSvg(rawSvg: string): string {
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
 * Replaces SVG placeholders in rendered HTML with sanitized, wrapped SVG blocks
 * that include a copy button.
 */
export function injectSvgBlocks(
    html: string,
    svgBlocks: string[],
): string {
    if (svgBlocks.length === 0) return html

    return html.replace(
        /(?:<p>)?SVGBLOCK_(\d+)_ENDSVGBLOCK(?:<\/p>)?/g,
        (_match, indexStr) => {
            const index = parseInt(indexStr, 10)
            const rawSvg = svgBlocks[index]
            if (!rawSvg) return ""

            const sanitized = sanitizeSvg(rawSvg)
            const escaped = rawSvg
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")

            return (
                `<div class="svg-block-wrapper">` +
                `<div class="svg-block-toolbar">` +
                `<div class="svg-copy-button" title="Copy raw SVG code" data-raw-svg="${escaped}">📋 Copy SVG</div>` +
                `<div class="svg-copy-png-button" title="Copy as PNG image" data-raw-svg="${escaped}">🖼️ Copy PNG</div>` +
                `</div>` +
                `<div class="svg-block-content">${sanitized}</div>` +
                `</div>`
            )
        },
    )
}