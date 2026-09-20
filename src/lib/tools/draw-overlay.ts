// Draw-overlay tool: draws labeled bounding boxes (bbox2d format) and lines
// over the first image of the latest user message, then attaches the
// annotated image to the assistant's message — so it is visible inline in
// the reply and in the chat's media list.
import {
    ChatMediaType,
    createMediaAttachment,
    getMediaBlob,
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
) {
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = color
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)

    if (!label) return

    ctx.font = `bold ${fontSize}px sans-serif`
    const pad = Math.round(fontSize / 3)
    const boxW = ctx.measureText(label).width + pad * 2
    const boxH = fontSize + pad
    const labelX = x1
    const labelY = y1 - boxH >= 0 ? y1 - boxH : y1

    ctx.fillStyle = color
    ctx.fillRect(labelX, labelY, boxW, boxH)
    ctx.fillStyle = "#ffffff"
    ctx.textBaseline = "top"
    ctx.fillText(label, labelX + pad, labelY + pad / 2)
}

// Draw one line: solid stroke plus optional label pill centered at the
// midpoint, above the line (below if no room), clamped inside the canvas
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
) {
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()

    if (!label) return

    ctx.font = `bold ${fontSize}px sans-serif`
    const pad = Math.round(fontSize / 3)
    const pillW = ctx.measureText(label).width + pad * 2
    const pillH = fontSize + pad
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2
    const labelX = Math.max(0, Math.min(canvasW - pillW, mx - pillW / 2))
    const labelY = my - pillH >= 0 ? my - pillH : my

    ctx.fillStyle = color
    ctx.fillRect(labelX, labelY, pillW, pillH)
    ctx.fillStyle = "#ffffff"
    ctx.textBaseline = "top"
    ctx.fillText(label, labelX + pad, labelY + pad / 2)
}

export const drawOverlayTool: ToolDefinition = {
    name: "draw_overlay",
    description:
        "Draw labeled bounding boxes and/or lines over the first image in the latest user message and attach the annotated image back to the chat media. All coordinates are in a 0-1000 normalized grid (Qwen-VL bbox2d convention).",
    parameters: {
        boxes: {
            type: "array",
            description:
                'Bounding boxes to draw, bbox2d format: {"bbox_2d": [x1, y1, x2, y2], "label": "..."} with coordinates in a 0-1000 normalized space (pass [] if drawing only lines)',
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
        lines: {
            type: "array",
            description:
                'Lines to draw, each {"from": [x, y], "to": [x, y], "label": "..."} with coordinates in a 0-1000 normalized space (pass [] if drawing only boxes)',
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
                },
                required: ["from", "to"],
            },
        },
    },
    async handler(params, context) {
        const boxes: BBoxEntry[] = Array.isArray(params.boxes)
            ? params.boxes
            : []
        const lines: LineEntry[] = Array.isArray(params.lines)
            ? params.lines
            : []
        if (boxes.length === 0 && lines.length === 0) {
            throw new Error(
                'boxes and/or lines is required: at least one non-empty array of {"bbox_2d": [x1, y1, x2, y2], "label": "..."} or {"from": [x, y], "to": [x, y], "label": "..."}',
            )
        }

        const chat = chatFind(context?.chatId ?? "")
        if (!chat) throw new Error("Chat session not found")

        // Only the latest user message's images are sent to the model
        // (see llm.ts), so that is the only image the model can point at
        let firstImage
        for (let i = chat.messages.length - 1; i >= 0; i--) {
            const msg = chat.messages[i]
            if (msg.role !== "user" || !msg.media) continue
            const img = msg.media.find((m) => m.type === ChatMediaType.IMAGE)
            if (img) {
                firstImage = img
                break
            }
        }
        if (!firstImage) {
            throw new Error(
                "No image media found in the latest user message — ask the user to send an image",
            )
        }

        const blobData = await getMediaBlob(firstImage)
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

        // Shared palette counter so boxes and lines never reuse the same
        // color next to each other
        let paletteIdx = 0
        let drawnBoxes = 0
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
            )
            paletteIdx++
            drawnBoxes++
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
            boxes: drawnBoxes,
            lines: drawnLines,
            image_size: [canvas.width, canvas.height],
        }
    },
}
