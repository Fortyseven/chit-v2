# Bounding Box Overlay Feature

## Context

When the AI responds with a JSON array of bounding box annotations (containing `bbox_2d`, `label`, `sub_label` fields) and there's an image in the conversation, we want to automatically render those bounding boxes as colored rectangles on top of the image, producing an annotated image.

Example JSON format:
```json
[
    {"bbox_2d": [341, 258, 397, 360], "label": "motorcyclist", "sub_label": "not wearing helmet"},
    {"bbox_2d": [212, 332, 274, 448], "label": "motorcyclist", "sub_label": "not wearing helmet"}
]
```

## Approach

Follow the existing SVG block pattern (extract-inject) already used in `MarkdownEditor.svelte`:
1. **Detect** bbox JSON in assistant response content (similar to `extractSvgBlocks`)
2. **Replace** the JSON with a placeholder during markdown rendering
3. **Inject** a canvas-rendered annotated image (as data URL) back into the rendered HTML

The source image (most recent user message image) will be resolved in `ChatLogRegular_Assistant` and passed down to `MarkdownEditor` as an optional prop. This keeps the feature integrated into the markdown pipeline while allowing access to chat state.

## Files to Create/Modify

### New Files
- `src/lib/text/bboxRenderer.ts` — Detection, extraction, injection, and canvas rendering logic

### Modified Files
- `src/app/components/MarkdownEditor.svelte` — Accept optional `sourceImage` prop, integrate bbox rendering
- `src/app/Chat/Timeline/Regular/ChatLogRegular_Assistant.svelte` — Resolve source image from chat state and pass to MarkdownEditor

## Reuse

- **`src/lib/text/svgRenderer.ts`** — Pattern to follow: `extract*Blocks` / `inject*Blocks` functions that operate on content strings before/after markdown rendering
- **`src/app/components/MarkdownEditor.svelte`** — Already has the extract-render-inject pipeline at lines 88-97
- **`src/lib/chatSession/chatAttachments.ts`** — Canvas drawing pattern for `resizeImage()` (create canvas, getContext, drawImage, toBlob)
- **`src/lib/memoizeBlob.ts`** — Blob URL caching to avoid recreation

## Implementation Details

### Types

```typescript
interface BoundingBoxEntry {
    bbox_2d: [number, number, number, number] // [x1, y1, x2, y2]
    label?: string
    sub_label?: string
}
```

### `src/lib/text/bboxRenderer.ts`

**`extractBboxBlocks(content: string)`**
- Regex to detect JSON arrays containing objects with `bbox_2d` arrays (4 numbers)
- Handles both fenced code blocks (```json) and bare JSON in the content
- Validates each entry has `bbox_2d` with exactly 4 numeric values
- `label` and `sub_label` are optional fields
- Returns `{ content: string, bboxBlocks: BoundingBoxEntry[][] }` (array of arrays for multiple JSON blocks)

**`injectBboxBlocks(html: string, bboxBlocks: BoundingBoxEntry[][], sourceImageUrl: string | null)`**
- Replaces placeholders with `<img>` tags containing canvas-rendered data URLs
- If no source image URL provided, renders a styled placeholder: "Bounding box data present but no source image available"
- Uses async canvas rendering via `onMount`-style callback or inline `<img onload>` for data URL generation

**`renderBoundingBoxes(imageUrl: string, boxes: BoundingBoxEntry[]): Promise<string>`**
- Loads image from URL, creates offscreen canvas matching image dimensions
- Draws image, then overlays rectangles with labels
- **Coordinate auto-scaling**: Detects coordinate system:
  - If max coord ≤ 1: treat as normalized (0-1), multiply by image dimensions
  - If max coord ≤ 1000 and image is larger: treat as normalized to 1000, scale proportionally  
  - Otherwise: treat as pixel coordinates
- Each box gets a distinct "primary" color from a rotating palette
- Labels rendered as a badge in the top-left corner of each rectangle
- Returns the canvas as a data URL (PNG)

**Color Palette** (primary colors, cycling):
`#FF3B30` (red), `#34C759` (green), `#007AFF` (blue), `#FF9500` (orange), `#AF52DE` (purple), `#FF2D55` (pink), `#5AC8FA` (cyan), `#FFCC00` (yellow)

### Integration in MarkdownEditor.svelte

1. Add optional `sourceImage` prop: `export let sourceImage: string | null = null`
2. Add bbox extraction alongside SVG extraction in the reactive block:
```typescript
const { content: withoutSvg, svgBlocks } = extractSvgBlocks(processed)
const { content: withoutBbox, bboxBlocks } = extractBboxBlocks(withoutSvg)
const rendered = md.render(withoutBbox).trim()
let result = injectSvgBlocks(rendered, svgBlocks)
result = injectBboxBlocks(result, bboxBlocks, sourceImage)
```
3. Bbox injection is deferred (async) — placeholders show a loading state, then get replaced when canvas rendering completes

### Integration in ChatLogRegular_Assistant.svelte

1. Import helper to find most recent user message image
2. Resolve source image URL from chat state:
```typescript
function findSourceImage(currentIndex: number): string | null {
    // Search backwards through messages for the most recent user message with an image
    const messages = $currentChat?.messages || []
    for (let i = currentIndex - 1; i >= 0; i--) {
        const msg = messages[i]
        if (msg.role === 'user' && msg.media?.some(m => m.type === ChatMediaType.IMAGE)) {
            // Return the blob URL for the first image in that message
            return getMediaUrl(msg.media[0])
        }
    }
    return null
}
```
3. Pass resolved image URL to MarkdownEditor: `<MarkdownEditor sourceImage={sourceImageUrl} ... />`

## Decisions Made

1. **Source Image**: Most recent user message with an image (search backwards from assistant message)
2. **Coordinates**: Auto-detect — supports pixel coords, normalized 0-1, and normalized-to-1000
3. **Labels**: Both `label` and `sub_label` displayed in a colored badge at the rectangle's top-left corner
4. **Streaming**: Wait for complete JSON — no rendering until the full JSON array is parseable

## Steps

- [x] Create `src/lib/text/bboxRenderer.ts`:
  - [x] Define `BoundingBoxEntry` interface
  - [x] Implement `extractBboxBlocks()` — regex detection, JSON validation, placeholder replacement
  - [x] Implement `renderBoundingBoxes()` — canvas drawing with auto-scaling, colors, label badges
  - [x] Implement `injectBboxBlocks()` — placeholder replacement with rendered img tags
- [x] Modify `src/app/components/MarkdownEditor.svelte`:
  - [x] Add optional `sourceImage: string | null` prop
  - [x] Import bbox renderer utilities
  - [x] Add bbox extraction after SVG extraction in reactive block
  - [x] Add bbox injection after SVG injection
  - [x] Handle async bbox rendering (deferred placeholder replacement)
  - [x] Add bbox button handlers: copy image, download, toggle JSON/image
- [x] Modify `src/app/Chat/Timeline/Regular/ChatLogRegular_Assistant.svelte`:
  - [x] Import `ChatMediaType` enum and `getMediaBlob`
  - [x] Implement `resolveSourceImage()` helper to locate most recent user image
  - [x] Pass resolved `sourceImage` URL to all `<MarkdownEditor>` instances
- [x] Edge cases:
  - [x] No image in conversation → show styled placeholder message
  - [x] Malformed JSON → render as normal markdown (no crash)
  - [x] Streaming partial JSON → wait until complete (no partial rendering)
  - [x] Empty bbox_2d array → no overlay, render normally

## Verification

- [x] Response with bbox JSON + image in conversation → annotated image appears with colored rectangles and label badges
- [x] Response without bbox JSON → renders normally as markdown, no changes
- [x] Response with bbox JSON but no image → shows "no source image" placeholder
- [x] Multiple boxes in one response → each gets a distinct color from the palette
- [x] Labels display correctly: `label` on top, `sub_label` below (if present), in a corner badge
- [x] Coordinate auto-scaling works: test with pixel coords, normalized 0-1, and normalized-to-1000
- [x] Streaming: bbox JSON only renders after the complete array is received
- [x] Malformed JSON (e.g., missing closing bracket) → treated as regular text, no errors
- [x] Build succeeds with no errors
