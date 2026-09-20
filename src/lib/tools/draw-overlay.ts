// Draw-overlay tool: draws labeled bounding boxes (bbox2d format), ellipses,
// and lines/arrows over an image in the latest user message, then attaches
// the annotated image to the assistant's message — so it is visible inline
// in the reply and in the chat's media list.
import {
    ChatMediaType,
    createMediaAttachment,
    getMediaBlob,
    type MediaAttachment,
} from "../chatSession/chatAttachments"
import { addStreamingMedia } from "../chatSession/streamingState"
import { chatFind } from "../chatSession/chatActions"
import type { ToolDefinition } from "./types"

// Distinct, high-contrast colors cycled per box index
const PALETTE = [
    "#ef4444", // red
    "#22c55e", // green
    "#3b82f6", // blue
    "#f59e0b", // amber
    "#a855f7", // purple
    "#06b6d4", // cyan
    "#ec4899", // pink
    "#eab308", // yellow
]

interface BBoxEntry {
    bbox_2d: number[]
    label?: string
}

interface LineEntry {
    from: number[]
    to: number[]
    label?: string
    arrowhead?: boolean
}

// Load a Blob into an HTMLImageElement (rejects on decode failure)
function loadImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob)
        const img = new Image()
        img.onload = () => {
            URL.revokeObjectURL(url)
            resolve(img)
        }
        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error("Failed to decode image"))
        }
        img.src = url
    })
}

// Scale a single [x, y] point from 0-1000 normalized space to pixel space,
// clamping to range (non-finite values become 0)
function scalePoint(
    point: number[],
    width: number,
    height: number,
): [number, number] {
    const norm = (v: number, max: number) =>
        (Number.isFinite(v) ? Math.max(0, Math.min(1000, v)) / 1000 : 0) * max
    return [norm(point[0], width), norm(point[1], height)]
}

// Convert [x1, y1, x2, y2] from 0-1000 normalized space to pixel space,
// clamping to range and normalizing so x2 > x1 and y2 > y1
function toPixels(
    box: number[],
    width: number,
    height: number,
): [number, number, number, number] {
    let [a, b] = scalePoint([box[0], box[1]], width, height)
    let [c, d] = scalePoint([box[2], box[3]], width, height)
    if (c < a) [a, c] = [c, a]
    if (d < b) [b, d] = [d, b]
    return [a, b, c, d]
}

// Height of a label pill at the given font size
function pillHeight(fontSize: number): number {
    return fontSize + Math.round(fontSize / 3)
}

// Draw a label pill (filled rect + white text) with its top-left corner at
// (x, y), clamped inside the canvas. With center=true, x is treated as the
// pill's horizontal center.
function drawLabelPill(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    label: string,
    color: string,
    fontSize: number,
    canvasW: number,
    canvasH: number,
    center = false,
) {
    if (!label) return
    ctx.font = `bold ${fontSize}px sans-serif`
    const pad = Math.round(fontSize / 3)
    const w = ctx.measureText(label).width + pad * 2
    const h = pillHeight(fontSize)
    const px = Math.max(0, Math.min(canvasW - w, center ? x - w / 2 : x))
    const py = Math.max(0, Math.min(canvasH - h, y))

    ctx.fillStyle = color
    ctx.fillRect(px, py, w, h)
    ctx.fillStyle = "#ffffff"
    ctx.textBaseline = "top"
    ctx.fillText(label, px + pad, py + pad / 2)
}

// Draw one box: outline plus label pill above the box (inside if no room)
function drawBox(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    label: string,
    lineWidth: number,
    fontSize: number,
    canvasW: number,
    canvasH: number,
) {
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = color
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)

    // Label pill above the box's top-left corner (inside if no room above)
    const h = pillHeight(fontSize)
    drawLabelPill(
        ctx,
        x1,
        y1 - h >= 0 ? y1 - h : y1,
        label,
        color,
        fontSize,
        canvasW,
        canvasH,
    )
}

// Draw one line: solid stroke, optional filled arrowhead at the 'to' end,
// plus optional label pill centered at the midpoint, above the line (below
// if no room), clamped inside the canvas
function drawLine(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    label: string,
    lineWidth: number,
    fontSize: number,
    canvasW: number,
    canvasH: number,
    arrowhead: boolean,
) {
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()

    // Filled arrowhead at the 'to' end; skipped for near-zero-length lines
    if (arrowhead) {
        const dist = Math.hypot(x2 - x1, y2 - y1)
        const headLen = Math.max(lineWidth * 4, fontSize)
        if (dist > headLen) {
            const angle = Math.atan2(y2 - y1, x2 - x1)
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.moveTo(x2, y2)
            ctx.lineTo(
                x2 - headLen * Math.cos(angle - Math.PI / 6),
                y2 - headLen * Math.sin(angle - Math.PI / 6),
            )
            ctx.lineTo(
                x2 - headLen * Math.cos(angle + Math.PI / 6),
                y2 - headLen * Math.sin(angle + Math.PI / 6),
            )
            ctx.closePath()
            ctx.fill()
        }
    }

    // Label pill centered on the line midpoint, above it (below if no room)
    const h = pillHeight(fontSize)
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2
    drawLabelPill(
        ctx,
        mx,
        my - h >= 0 ? my - h : my,
        label,
        color,
        fontSize,
        canvasW,
        canvasH,
        true,
    )
}

// Draw one ellipse inscribed in the given bounding rect, with the label pill
// above its top-center (inside if no room), clamped inside the canvas
function drawEllipse(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    label: string,
    lineWidth: number,
    fontSize: number,
    canvasW: number,
    canvasH: number,
) {
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.ellipse(
        (x1 + x2) / 2,
        (y1 + y2) / 2,
        Math.max(0, (x2 - x1) / 2),
        Math.max(0, (y2 - y1) / 2),
        0,
        0,
        Math.PI * 2,
    )
    ctx.stroke()

    const h = pillHeight(fontSize)
    drawLabelPill(
        ctx,
        (x1 + x2) / 2,
        y1 - h >= 0 ? y1 - h : y1,
        label,
        color,
        fontSize,
        canvasW,
        canvasH,
        true,
    )
}

export const drawOverlayTool: ToolDefinition = {
    name: "draw_overlay",
    description:
        "Draw labeled bounding boxes, ellipses, and/or lines (optionally with arrowheads) over an image in the latest user message and attach the annotated image back to the chat media. All coordinates are in a 0-1000 normalized grid (Qwen-VL bbox2d convention).",
    parameters: {
        boxes: {
            type: "array",
            description:
                'Bounding boxes to draw, bbox2d format: {"bbox_2d": [x1, y1, x2, y2], "label": "..."} with coordinates in a 0-1000 normalized space (pass [] if not drawing boxes)',
            items: {
                type: "object",
                properties: {
                    bbox_2d: {
                        type: "array",
                        items: { type: "number" },
                        description:
                            "[x1, y1, x2, y2] in 0-1000 normalized coordinates",
                    },
                    label: {
                        type: "string",
                        description: "Short label drawn above the box",
                    },
                },
                required: ["bbox_2d"],
            },
        },
        ellipses: {
            type: "array",
            description:
                'Ellipses to draw (inscribed in the given bounding box), same bbox2d format: {"bbox_2d": [x1, y1, x2, y2], "label": "..."} with coordinates in a 0-1000 normalized space (pass [] if not drawing ellipses)',
            items: {
                type: "object",
                properties: {
                    bbox_2d: {
                        type: "array",
                        items: { type: "number" },
                        description:
                            "[x1, y1, x2, y2] bounding box of the ellipse, in 0-1000 normalized coordinates",
                    },
                    label: {
                        type: "string",
                        description: "Short label drawn above the ellipse",
                    },
                },
                required: ["bbox_2d"],
            },
        },
        lines: {
            type: "array",
            description:
                'Lines to draw, each {"from": [x, y], "to": [x, y], "label": "..."} with coordinates in a 0-1000 normalized space. Add "arrowhead": true to make it an arrow pointing from one thing to another (pass [] if not drawing lines)',
            items: {
                type: "object",
                properties: {
                    from: {
                        type: "array",
                        items: { type: "number" },
                        description:
                            "Start point [x, y] in 0-1000 normalized coordinates",
                    },
                    to: {
                        type: "array",
                        items: { type: "number" },
                        description:
                            "End point [x, y] in 0-1000 normalized coordinates",
                    },
                    label: {
                        type: "string",
                        description: "Short label drawn near the line midpoint",
                    },
                    arrowhead: {
                        type: "boolean",
                        description:
                            "If true, draw an arrowhead at the 'to' end (arrow)",
                    },
                },
                required: ["from", "to"],
            },
        },
        image_index: {
            type: "number",
            description:
                "0-based index of the image in the latest user message to annotate (default 0 = first image)",
        },
    },
    async handler(params, context) {
        const boxes: BBoxEntry[] = Array.isArray(params.boxes)
            ? params.boxes
            : []
        const ellipses: BBoxEntry[] = Array.isArray(params.ellipses)
            ? params.ellipses
            : []
        const lines: LineEntry[] = Array.isArray(params.lines)
            ? params.lines
            : []
        if (boxes.length === 0 && ellipses.length === 0 && lines.length === 0) {
            throw new Error(
                'boxes, ellipses and/or lines is required: at least one non-empty array of {"bbox_2d": [x1, y1, x2, y2], "label": "..."} or {"from": [x, y], "to": [x, y], "label": "..."}',
            )
        }

        const chat = chatFind(context?.chatId ?? "")
        if (!chat) throw new Error("Chat session not found")

        // The model only sees the latest user message's images (see llm.ts),
        // so that is the only message it can point at
        const requestedIndex = Number(params.image_index)
        const imageIndex =
            Number.isInteger(requestedIndex) && requestedIndex >= 0
                ? requestedIndex
                : 0

        let images: MediaAttachment[] = []
        for (let i = chat.messages.length - 1; i >= 0; i--) {
            const msg = chat.messages[i]
            if (msg.role !== "user" || !msg.media) continue
            images = msg.media.filter((m) => m.type === ChatMediaType.IMAGE)
            if (images.length > 0) break
        }
        if (images.length === 0) {
            throw new Error(
                "No image media found in the latest user message — ask the user to send an image",
            )
        }
        if (imageIndex >= images.length) {
            throw new Error(
                `image_index ${imageIndex} out of range — the latest user message has ${images.length} image(s); valid indices are 0-${images.length - 1}`,
            )
        }
        const targetImage = images[imageIndex]

        const blobData = await getMediaBlob(targetImage)
        if (!(blobData instanceof Blob)) {
            throw new Error("Image media is not a blob")
        }

        const img = await loadImage(blobData)
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        if (!ctx) throw new Error("Failed to get canvas context")

        ctx.drawImage(img, 0, 0)

        // Scale stroke and label size to the image so annotations stay readable
        const lineWidth = Math.max(2, Math.round(canvas.width / 300))
        const fontSize = Math.max(14, Math.round(canvas.height / 32))

        // Shared palette counter so adjacent shapes never reuse the same color
        let paletteIdx = 0
        let drawnBoxes = 0
        let drawnEllipses = 0
        let drawnLines = 0

        boxes.forEach((entry, i) => {
            if (
                !entry ||
                !Array.isArray(entry.bbox_2d) ||
                entry.bbox_2d.length < 4
            ) {
                console.warn(
                    `draw_overlay: skipping box ${i}: malformed bbox_2d`,
                )
                return
            }
            const [x1, y1, x2, y2] = toPixels(
                entry.bbox_2d,
                canvas.width,
                canvas.height,
            )
            drawBox(
                ctx,
                x1,
                y1,
                x2,
                y2,
                PALETTE[paletteIdx % PALETTE.length],
                entry.label ?? "",
                lineWidth,
                fontSize,
                canvas.width,
                canvas.height,
            )
            paletteIdx++
            drawnBoxes++
        })

        // Ellipses (same bbox2d format, inscribed in the box)
        ellipses.forEach((entry, i) => {
            if (
                !entry ||
                !Array.isArray(entry.bbox_2d) ||
                entry.bbox_2d.length < 4
            ) {
                console.warn(
                    `draw_overlay: skipping ellipse ${i}: malformed bbox_2d`,
                )
                return
            }
            const [x1, y1, x2, y2] = toPixels(
                entry.bbox_2d,
                canvas.width,
                canvas.height,
            )
            drawEllipse(
                ctx,
                x1,
                y1,
                x2,
                y2,
                PALETTE[paletteIdx % PALETTE.length],
                entry.label ?? "",
                lineWidth,
                fontSize,
                canvas.width,
                canvas.height,
            )
            paletteIdx++
            drawnEllipses++
        })

        lines.forEach((entry, i) => {
            if (
                !entry ||
                !Array.isArray(entry.from) ||
                entry.from.length < 2 ||
                !Array.isArray(entry.to) ||
                entry.to.length < 2
            ) {
                console.warn(
                    `draw_overlay: skipping line ${i}: malformed from/to`,
                )
                return
            }
            const [x1, y1] = scalePoint(entry.from, canvas.width, canvas.height)
            const [x2, y2] = scalePoint(entry.to, canvas.width, canvas.height)
            drawLine(
                ctx,
                x1,
                y1,
                x2,
                y2,
                PALETTE[paletteIdx % PALETTE.length],
                entry.label ?? "",
                lineWidth,
                fontSize,
                canvas.width,
                canvas.height,
                entry.arrowhead === true,
            )
            paletteIdx++
            drawnLines++
        })

        const outBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (b) =>
                    b
                        ? resolve(b)
                        : reject(new Error("Failed to encode annotated image")),
                "image/png",
            )
        })

        // Attach to the assistant's message: rendered inline in the reply and
        // listed in the chat media list (same flow as generate_image).
        // Note: the model does not re-see assistant-message images on the
        // next turn — only the latest user message's images are sent to it.
        addStreamingMedia(
            createMediaAttachment(
                outBlob,
                ChatMediaType.IMAGE,
                "annotated.png",
            ),
        )

        // Return metadata only — never the image data (would blow the context)
        return {
            image_index: imageIndex,
            boxes: drawnBoxes,
            ellipses: drawnEllipses,
            lines: drawnLines,
            image_size: [canvas.width, canvas.height],
        }
    },
}
