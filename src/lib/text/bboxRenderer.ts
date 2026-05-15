// Bounding box renderer for object detection responses
// Follows the extract-inject pattern of svgRenderer.ts

// Placeholder markers that markdown-it won't escape or transform
const BBOX_PLACEHOLDER_PREFIX = "BBOXBLOCK_"
const BBOX_PLACEHOLDER_SUFFIX = "_ENDBBOXBLOCK"

/**
 * Bounding box entry from object detection responses.
 * bbox_2d: [x1, y1, x2, y2] in various coordinate systems (auto-detected)
 */
export interface BoundingBoxEntry {
    bbox_2d: [number, number, number, number]
    label?: string
    sub_label?: string
}

/** Color palette for bounding boxes (primary colors, cycling) */
const BBOX_COLORS = [
    "#FF3B30", // red
    "#34C759", // green
    "#007AFF", // blue
    "#FF9500", // orange
    "#AF52DE", // purple
    "#FF2D55", // pink
    "#5AC8FA", // cyan
    "#FFCC00", // yellow
]

/**
 * Validates that a parsed JSON object is a valid bounding box entry.
 */
function isValidBboxEntry(obj: any): obj is BoundingBoxEntry {
    if (!obj || typeof obj !== "object") return false
    if (!Array.isArray(obj.bbox_2d) || obj.bbox_2d.length !== 4) return false
    return obj.bbox_2d.every((v: any) => typeof v === "number" && isFinite(v))
}

/**
 * Extracts bounding box JSON blocks from content, replacing them with placeholders.
 * Handles both fenced code blocks (```json) and bare JSON arrays.
 * Returns the modified content and an array of raw JSON strings.
 */
export function extractBboxBlocks(content: string): {
    content: string
    bboxBlocks: BoundingBoxEntry[][]
} {
    const bboxBlocks: BoundingBoxEntry[][] = []

    // First, extract from fenced code blocks (```json or ```)
    const fencedJsonRegex = /```(?:json)?\s*\n([\s\S]*?)\n```/gi
    let modified = content.replace(fencedJsonRegex, (_match, jsonContent) => {
        const parsed = tryParseBbox(jsonContent.trim())
        if (parsed) {
            const index = bboxBlocks.length
            bboxBlocks.push(parsed)
            return `${BBOX_PLACEHOLDER_PREFIX}${index}${BBOX_PLACEHOLDER_SUFFIX}`
        }
        return _match // Not a bbox JSON, leave as-is
    })

    // Then, extract bare JSON arrays (not in fences)
    // Match arrays that contain bbox_2d objects
    const bareJsonRegex = /\[\s*\{[^}]*(?:bbox_2d)[^}]*\}(?:\s*,?\s*\{[^}]*(?:bbox_2d)[^}]*\})*\s*\]/gi
    modified = modified.replace(bareJsonRegex, (match) => {
        const parsed = tryParseBbox(match.trim())
        if (parsed) {
            const index = bboxBlocks.length
            bboxBlocks.push(parsed)
            return `${BBOX_PLACEHOLDER_PREFIX}${index}${BBOX_PLACEHOLDER_SUFFIX}`
        }
        return match // Not valid bbox JSON, leave as-is
    })

    // Finally, extract bare single objects with bbox_2d
    const bareJsonObjectRegex = /\{[^}]*(?:bbox_2d)[^}]*\}/gi
    modified = modified.replace(bareJsonObjectRegex, (match) => {
        const parsed = tryParseBbox(match.trim())
        if (parsed) {
            const index = bboxBlocks.length
            bboxBlocks.push(parsed)
            return `${BBOX_PLACEHOLDER_PREFIX}${index}${BBOX_PLACEHOLDER_SUFFIX}`
        }
        return match // Not valid bbox JSON, leave as-is
    })

    return { content: modified, bboxBlocks }
}

/**
 * Attempts to parse a string as a bounding box JSON array or single object.
 * Returns null if parsing fails or validation fails.
 * Single objects are wrapped in an array.
 */
function tryParseBbox(jsonStr: string): BoundingBoxEntry[] | null {
    try {
        const parsed = JSON.parse(jsonStr)
        // Handle array of entries
        if (Array.isArray(parsed)) {
            if (parsed.length === 0) return null // Empty array, not useful
            if (!parsed.every((item) => isValidBboxEntry(item))) return null
            return parsed as BoundingBoxEntry[]
        }
        // Handle single object
        if (isValidBboxEntry(parsed)) {
            return [parsed]
        }
        return null
    } catch {
        return null
    }
}

/**
 * Detects the coordinate system and returns scale factors.
 * Supports: pixel coordinates, normalized 0-1, normalized to 1000.
 */
function detectCoordinateScale(
    boxes: BoundingBoxEntry[],
    imgWidth: number,
    imgHeight: number,
): { scaleX: number; scaleY: number } {
    // Find the maximum coordinate value across all boxes
    let maxCoord = 0
    for (const box of boxes) {
        for (const coord of box.bbox_2d) {
            if (coord > maxCoord) maxCoord = coord
        }
    }

    // Detect coordinate system
    if (maxCoord <= 1.0) {
        // Normalized 0-1 coordinates
        return { scaleX: imgWidth, scaleY: imgHeight }
    } else if (maxCoord <= 1000) {
        // Normalized to 1000 (common in object detection models)
        return { scaleX: imgWidth / 1000, scaleY: imgHeight / 1000 }
    } else {
        // Pixel coordinates - use as-is
        return { scaleX: 1, scaleY: 1 }
    }
}

/**
 * Renders bounding boxes on top of a source image using canvas.
 * Returns a Promise that resolves to a data URL of the annotated image.
 */
export function renderBoundingBoxes(
    imageUrl: string,
    boxes: BoundingBoxEntry[],
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"

        img.onload = () => {
            const canvas = document.createElement("canvas")
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            const ctx = canvas.getContext("2d")
            if (!ctx) {
                reject(new Error("Failed to get canvas 2D context"))
                return
            }

            // Draw the source image
            ctx.drawImage(img, 0, 0)

            // Detect coordinate system
            const { scaleX, scaleY } = detectCoordinateScale(
                boxes,
                img.naturalWidth,
                img.naturalHeight,
            )

            // Draw each bounding box
            boxes.forEach((box, i) => {
                const color = BBOX_COLORS[i % BBOX_COLORS.length]
                const [x1, y1, x2, y2] = box.bbox_2d

                // Scale coordinates
                const x = Math.min(x1, x2) * scaleX
                const y = Math.min(y1, y2) * scaleY
                const w = Math.abs(x2 - x1) * scaleX
                const h = Math.abs(y2 - y1) * scaleY

                // Draw rectangle outline
                ctx.strokeStyle = color
                ctx.lineWidth = 3
                ctx.strokeRect(x, y, w, h)

                // Draw label badge if label or sub_label present
                const labels: string[] = []
                if (box.label) labels.push(box.label)
                if (box.sub_label) labels.push(box.sub_label)

                if (labels.length > 0) {
                    drawLabelBadge(ctx, x, y, w, labels, color, img.naturalWidth, img.naturalHeight)
                }
            })

            // Convert to data URL
            try {
                const dataUrl = canvas.toDataURL("image/png")
                resolve(dataUrl)
            } catch (err) {
                reject(err)
            }
        }

        img.onerror = () => {
            reject(new Error(`Failed to load source image: ${imageUrl}`))
        }

        img.src = imageUrl
    })
}

/**
 * Draws a label badge above a bounding box.
 * Positions the badge just above the box, clamped to canvas bounds.
 */
function drawLabelBadge(
    ctx: CanvasRenderingContext2D,
    boxX: number,
    boxY: number,
    boxWidth: number,
    labels: string[],
    color: string,
    canvasWidth: number,
    canvasHeight: number,
): void {
    const fontSize = Math.max(12, Math.min(16, boxWidth * 0.08))
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`

    // Measure text to determine badge size
    const padding = 4
    let maxWidth = 0
    labels.forEach((label) => {
        const metrics = ctx.measureText(label)
        if (metrics.width > maxWidth) maxWidth = metrics.width
    })

    const badgeWidth = maxWidth + padding * 2
    const badgeHeight = labels.length * (fontSize + 2) + padding * 2
    const gap = 2 // gap between badge and box

    // Position badge above the box, clamped to canvas bounds
    let badgeX = boxX
    let badgeY = boxY - badgeHeight - gap

    // Clamp to canvas bounds
    if (badgeX < 0) badgeX = 0
    if (badgeX + badgeWidth > canvasWidth) badgeX = canvasWidth - badgeWidth
    if (badgeY < 0) badgeY = boxY + 2 // fallback: place inside box if no room above

    // Draw badge background with rounded corners
    ctx.fillStyle = color
    const cornerRadius = 4
    ctx.beginPath()
    ctx.moveTo(badgeX + cornerRadius, badgeY)
    ctx.lineTo(badgeX + badgeWidth - cornerRadius, badgeY)
    ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + cornerRadius)
    ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - cornerRadius)
    ctx.quadraticCurveTo(
        badgeX + badgeWidth,
        badgeY + badgeHeight,
        badgeX + badgeWidth - cornerRadius,
        badgeY + badgeHeight,
    )
    ctx.lineTo(badgeX + cornerRadius, badgeY + badgeHeight)
    ctx.quadraticCurveTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - cornerRadius)
    ctx.lineTo(badgeX, badgeY + cornerRadius)
    ctx.quadraticCurveTo(badgeX, badgeY, badgeX + cornerRadius, badgeY)
    ctx.closePath()
    ctx.fill()

    // Draw label text
    ctx.fillStyle = "#000000"
    ctx.textBaseline = "top"
    labels.forEach((label, i) => {
        ctx.fillText(label, badgeX + padding, badgeY + padding + i * (fontSize + 2))
    })
}

/**
 * Replaces bbox placeholders in rendered HTML with annotated image wrappers.
 * Includes toolbar with copy/download buttons and toggle for raw JSON.
 * If no source image is available, shows a styled placeholder message.
 */
export function injectBboxBlocks(
    html: string,
    bboxBlocks: BoundingBoxEntry[][],
    sourceImageUrl: string | null,
): string {
    if (bboxBlocks.length === 0) return html

    const placeholderRegex = new RegExp(`(?:<p>)?${BBOX_PLACEHOLDER_PREFIX}(\\d+)${BBOX_PLACEHOLDER_SUFFIX}(?:</p>)?`, "g")

    return html.replace(placeholderRegex, (_match, indexStr) => {
        const index = parseInt(indexStr, 10)
        const boxes = bboxBlocks[index]
        if (!boxes) return ""

        // Escape the raw JSON for data attributes
        const rawJson = JSON.stringify(boxes, null, 2)
        const escapedJson = rawJson
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")

        // If no source image, show placeholder
        if (!sourceImageUrl) {
            return (
                `<div class="bbox-block-wrapper">` +
                `<div class="bbox-block-toolbar">` +
                `<div class="bbox-toggle-button" data-toggle="bbox-${index}" data-raw-json="${escapedJson}">📋 Show JSON</div>` +
                `</div>` +
                `<div class="bbox-block-content">` +
                `<div class="bbox-no-image">No source image available for bounding box overlay</div>` +
                `</div>` +
                `<div class="bbox-raw-json" data-json="${escapedJson}" style="display:none"></div>` +
                `</div>`
            )
        }

        // Return wrapper with loading state; actual rendering happens asynchronously
        // The data-bbox-index attribute lets the component identify which block to render
        return (
            `<div class="bbox-block-wrapper" data-bbox-index="${index}">` +
            `<div class="bbox-block-toolbar">` +
            `<div class="bbox-copy-button" title="Copy annotated image to clipboard" data-bbox-index="${index}">📋 Copy Image</div>` +
            `<div class="bbox-download-button" title="Download annotated image" data-bbox-index="${index}">💾 Download</div>` +
            `<div class="bbox-toggle-button" title="Toggle between image and raw JSON" data-toggle="bbox-${index}" data-raw-json="${escapedJson}">📄 Show JSON</div>` +
            `</div>` +
            `<div class="bbox-block-content" data-bbox-index="${index}">` +
            `<div class="bbox-loading">Rendering annotated image...</div>` +
            `</div>` +
            `<div class="bbox-raw-json" data-json="${escapedJson}" style="display:none"><pre>${escapedJson}</pre></div>` +
            `</div>`
        )
    },
    )
}

/**
 * Asynchronously renders all bbox blocks in a container element.
 * Called from the component after DOM insertion to trigger canvas rendering.
 */
export function renderBboxBlocksInContainer(
    container: Element,
    sourceImageUrl: string,
    bboxBlocks: BoundingBoxEntry[][],
): void {
    const wrappers = container.querySelectorAll(".bbox-block-wrapper[data-bbox-index]")
    wrappers.forEach((wrapper) => {
        const indexStr = wrapper.getAttribute("data-bbox-index")
        if (indexStr === null) return
        const index = parseInt(indexStr, 10)
        const boxes = bboxBlocks[index]
        if (!boxes) return

        const contentEl = wrapper.querySelector(".bbox-block-content")
        if (!contentEl) return

        renderBoundingBoxes(sourceImageUrl, boxes)
            .then((dataUrl) => {
                // Store data URL on the wrapper for copy/download buttons
                wrapper.setAttribute("data-annotated-url", dataUrl)

                // Replace loading state with the image
                contentEl.innerHTML = `<img src="${dataUrl}" class="bbox-annotated-image" alt="Annotated image with bounding boxes" />`
            })
            .catch((err) => {
                contentEl.innerHTML = `<div class="bbox-error">Failed to render annotated image: ${err.message}</div>`
                console.error("Bbox rendering error:", err)
            })
    })
}