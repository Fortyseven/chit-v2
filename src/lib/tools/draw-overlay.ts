// Draw-overlay tool: draws labeled bounding boxes (bbox2d format) over the
// first image of the latest user message, then attaches the annotated image
// back to the chat's media as if the user had pasted it themselves — so it is
// visible in the input bar and seen by the model on the next user message.
import {
    ChatMediaType,
    chatAddPastedMedia,
    getMediaBlob,
} from "../chatSession/chatAttachments"
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

// Convert [x1, y1, x2, y2] from 0-1000 normalized space to pixel space,
// clamping to range and normalizing so x2 > x1 and y2 > y1
function toPixels(
    box: number[],
    width: number,
    height: number,
): [number, number, number, number] {
    const norm = (v: number, max: number) =>
        (Number.isFinite(v) ? Math.max(0, Math.min(1000, v)) / 1000 : 0) * max

    let a = norm(box[0], width)
    let b = norm(box[1], height)
    let c = norm(box[2], width)
    let d = norm(box[3], height)
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

export const drawOverlayTool: ToolDefinition = {
    name: "draw_overlay",
    description:
        "Draw labeled bounding-box annotations over the first image in the latest user message and attach the annotated image back to the chat media. Box coordinates are [x1, y1, x2, y2] in a 0-1000 normalized grid (Qwen-VL bbox2d convention).",
    parameters: {
        boxes: {
            type: "array",
            description:
                'Bounding boxes to draw, bbox2d format: {"bbox_2d": [x1, y1, x2, y2], "label": "..."} with coordinates in a 0-1000 normalized space',
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
    },
    async handler(params, context) {
        const boxes = (params.boxes ?? []) as BBoxEntry[]
        if (!Array.isArray(boxes) || boxes.length === 0) {
            throw new Error(
                'boxes is required: a non-empty array of {"bbox_2d": [x1, y1, x2, y2], "label": "..."}',
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

        let drawn = 0
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
                PALETTE[i % PALETTE.length],
                entry.label ?? "",
                lineWidth,
                fontSize,
            )
            drawn++
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

        // Attach as if the user pasted it: stored in IndexedDB, shown in the
        // input bar, and included with the next user message to the model.
        // Do NOT use addStreamingMedia — that attaches to the assistant reply.
        await chatAddPastedMedia(
            context?.chatId ?? "",
            outBlob,
            ChatMediaType.IMAGE,
            "annotated.png",
        )

        // Return metadata only — never the image data (would blow the context)
        return {
            annotated: drawn,
            image_size: [canvas.width, canvas.height],
        }
    },
}
