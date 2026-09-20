# Plan: `draw_overlay` agent tool — draw bounding-box annotations over the first media image

## Context
The user wants a new agent tool that lets the model **modify the first media (image) in the conversation by drawing content on top of it as an overlay**. The annotation format follows the existing `src/preset-prompts/gfx/bbox2d.js` convention: a JSON array of `{"bbox_2d": [x1, y1, x2, y2], "label": "..."}` objects.

The app already has:
- An agent-tool registry (`src/lib/tools/`) where tools stream their results into the assistant reply
- A `generate_image` tool that adds media to the assistant message via `addStreamingMedia()`
- Images from the **latest user message** sent to the LLM as base64 data URLs (llm.ts), so the model *has seen* the image it would annotate

The new tool closes the loop: the model identifies objects in the image it was shown, calls the tool with `bbox_2d` boxes, and the annotated image is appended to the assistant's reply.

## Decisions (confirmed with user)
1. **Coordinates:** `bbox_2d = [x1, y1, x2, y2]` normalized to a **0–1000 grid** (Qwen-VL / bbox2d.js convention); tool scales to actual image pixels.
2. **Target:** first `IMAGE` attachment of the **latest user message**; annotated PNG **appended to the assistant reply** (original untouched).
3. **Style:** per-box colors cycled from a fixed palette; label rendered in a small background pill above the box.
4. **Scope:** boxes + labels only (no freeform strokes).

## Approach
**Client-side canvas rendering** (no media-server round-trip): load the first image of the latest user message, draw it on a full-resolution canvas, draw each rectangle + label, export PNG, and attach it via **`chatAddPastedMedia()`** — as if the user pasted it themselves: stored in IndexedDB, shown in the input-bar media pills, and sent to the model with the next user message (per user feedback on approval; NOT `addStreamingMedia`, which would attach it to the assistant reply). Tool result returns small metadata only (never base64) — same constraint documented in `generate-image.ts`.

## Files to modify
| File | Change |
|---|---|
| `src/lib/tools/draw-overlay.ts` | **New** — tool definition + canvas drawing logic |
| `src/lib/tools/index.ts` | Register `drawOverlayTool` in the `tools` array |

## Reuse
| Existing utility | Where |
|---|---|
| `chatFind(chatId)` | `src/lib/chatSession/chatActions.ts:599` — locate chat from `context.chatId` |
| `getMediaBlob(attachment)` | `src/lib/chatSession/chatAttachments.ts` — resolve IndexedDB/in-memory blob (cached) |
| `createMediaAttachment(data, type, filename)` | `src/lib/chatSession/chatAttachments.ts` — build the attachment (plain Blob, no blobId — same as generate-image.ts) |
| `chatAddPastedMedia(chatId, blob, type, filename)` | `src/lib/chatSession/chatAttachments.ts:121` — stores in IndexedDB and appends to `chat.pastedMedia` (input-bar pills → next user message → model) |
| `ChatMediaType` enum | `src/lib/chatSession/chatAttachments.ts` |
| `ToolDefinition` shape | `src/lib/tools/types.ts`; handler pattern from `src/lib/tools/generate-image.ts` |

## Tool spec
```ts
export const drawOverlayTool: ToolDefinition = {
    name: 'draw_overlay',
    description: 'Draw bounding-box annotations (with labels) over the first image in the latest user message and return the annotated image. Coordinates are [x1, y1, x2, y2] normalized to a 0-1000 grid.',
    parameters: {
        boxes: {
            type: 'array',
            description: 'Bounding boxes to draw, bbox2d format: {"bbox_2d": [x1, y1, x2, y2], "label": "..."} with coordinates in a 0-1000 normalized space',
            items: {
                type: 'object',
                properties: {
                    bbox_2d: { type: 'array', items: { type: 'number' }, description: '[x1, y1, x2, y2] in 0-1000 normalized coordinates' },
                    label: { type: 'string', description: 'Short label drawn above the box' },
                },
                required: ['bbox_2d'],
            },
        },
    },
    ...
}
```

## Handler flow
1. `chatFind(context.chatId)` → walk `messages` backwards to the latest user message with `media` (mirrors `lastUserIndex` logic in `llm.ts`).
2. Take the first `IMAGE` attachment → `getMediaBlob()` → Blob.
3. `URL.createObjectURL(blob)` → Promise-wrapped `Image` → canvas at native `img.width`×`img.height`.
4. Per box: clamp values to 0–1000, swap if `x2 < x1` / `y2 < y1`, scale to pixels; `strokeRect` with palette color (cycled by index), stroke width scaled to image size (e.g. `max(2, round(width/300))`); draw `label` text in a filled pill above the box (font size scaled to image, e.g. `max(14, round(height/32))`).
5. `canvas.toBlob('image/png')`.
6. `URL.revokeObjectURL`. `chatAddPastedMedia(chatId, outBlob, ChatMediaType.IMAGE, 'annotated.png')` → image lands in the input bar as if pasted. Return `{ annotated: <count>, image_size: [w, h] }`.
7. No image found → `throw new Error('No image media found in the latest user message')` — `OpenAIDriver.ts` maps handler throws to `{ error }` tool results the model can react to.

## Steps
- [x] 1. Create `src/lib/tools/draw-overlay.ts` — tool definition + canvas drawing (palette, scaling, label pills)
- [x] 2. Register `drawOverlayTool` in `src/lib/tools/index.ts`
- [x] 3. Verify build + manual test

## Verification
- `npm run build` compiles clean (TypeScript strict, prettier style: 4 spaces, no semicolons).
- Manual: `npm run dev`, enable tools in a chat, send an image + "draw bounding boxes around the objects" → after the reply, the annotated image appears in the input bar as a media pill (as if pasted), and is sent to the model with the next user message.
- Edge cases:
  - Chat with no image → tool error surfaces in tool-call info, model explains it.
  - Multiple images in latest message → only the first is annotated.
  - Out-of-range / swapped coordinates → clamped/normalized, no crash.
