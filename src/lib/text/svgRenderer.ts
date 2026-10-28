import DOMPurify from "dompurify"

// Use a plain-text placeholder that markdown-it won't escape or transform
const SVG_PLACEHOLDER_PREFIX = "SVGBLOCK_"
const SVG_PLACEHOLDER_SUFFIX = "_ENDSVGBLOCK"

// Regions where a literal <svg> must NOT be pulled out: fenced code (any
// language) and inline code spans. Fences are matched first so that SVG
// source shown inside e.g. ```python is left alone.
const PROTECTED_RE =
    /^ {0,3}(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)\n {0,3}\1[`~]*[ \t]*$|(`+)(?!`)[^\n]*?[^`\n]\4(?!`)/gm

// A fence body that is nothing but one SVG document (optionally preceded by an
// XML prolog, DOCTYPE, or comments).
const FENCED_SVG_BODY_RE =
    /^\s*(?:<\?xml[\s\S]*?\?>\s*)?(?:<!DOCTYPE[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*(<svg[\s>][\s\S]*<\/svg>)\s*$/i

const SVG_FENCE_LANGS = new Set(["", "svg", "xml", "html"])

/**
 * Finds balanced top-level <svg>...</svg> spans in text (nested <svg> elements
 * stay inside their parent). Unclosed blocks are ignored.
 */
function findBareSvgSpans(text: string): [number, number][] {
    const spans: [number, number][] = []
    const tagRe = /<svg[\s>]|<\/svg\s*>/gi
    let depth = 0
    let start = -1
    let m: RegExpExecArray | null
    while ((m = tagRe.exec(text))) {
        if (m[0][1] !== "/") {
            if (depth++ === 0) start = m.index
        } else if (depth > 0 && --depth === 0) {
            spans.push([start, m.index + m[0].length])
        }
    }
    return spans
}

/**
 * Returns true if the SVG survives sanitization and still has drawable
 * content, so malformed or emptied-out blocks fall back to plain text.
 */
function isRenderableSvg(rawSvg: string): boolean {
    const clean = sanitizeSvg(rawSvg)
    return /<svg[\s>]/i.test(clean) && /<(?!\/|svg[\s>])[a-z]/i.test(clean)
}

/**
 * Extracts raw SVG blocks from content, replacing them with placeholders.
 * Handles SVG in ```svg/xml/html (or bare) code fences, including XML
 * prologs, and bare <svg> tags in prose. SVG inside other code fences or
 * inline code is left untouched, as is any block that isn't valid SVG.
 * Returns the modified content and an array of raw SVG strings.
 */
export function extractSvgBlocks(content: string): {
    content: string
    svgBlocks: string[]
} {
    const svgBlocks: string[] = []
    content = content.replace(/\r\n?/g, "\n")

    const placeholder = (svg: string): string => {
        const index = svgBlocks.length
        svgBlocks.push(svg)
        // Blank lines keep the placeholder in its own paragraph
        return `\n\n${SVG_PLACEHOLDER_PREFIX}${index}${SVG_PLACEHOLDER_SUFFIX}\n\n`
    }

    const extractBare = (text: string): string => {
        let out = ""
        let last = 0
        for (const [from, to] of findBareSvgSpans(text)) {
            const svg = text.slice(from, to)
            if (!isRenderableSvg(svg)) continue
            out += text.slice(last, from) + placeholder(svg)
            last = to
        }
        return out + text.slice(last)
    }

    let result = ""
    let last = 0
    PROTECTED_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = PROTECTED_RE.exec(content))) {
        result += extractBare(content.slice(last, m.index))
        last = m.index + m[0].length

        const lang = (m[2] ?? "").trim().toLowerCase()
        const body = m[1] !== undefined ? m[3].match(FENCED_SVG_BODY_RE) : null
        if (body && SVG_FENCE_LANGS.has(lang) && isRenderableSvg(body[1])) {
            result += placeholder(body[1])
        } else {
            result += m[0]
        }
    }
    result += extractBare(content.slice(last))

    return { content: result, svgBlocks }
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