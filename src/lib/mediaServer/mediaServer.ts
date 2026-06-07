import { get } from "svelte/store"
import { appState } from "../appState/appState"

/**
 * Get the configured media server URL from appState.
 */
export function getMediaServerUrl(): string {
    return get(appState).mediaServerUrl || ""
}

export interface GenerateImageOptions {
    model?: string
    n?: number // 1-4 images
    size?: string // e.g. "1024x1024"
    quality?: string // e.g. "standard" | "hd"
}

export interface GeneratedImage {
    b64_json: string
    revised_prompt?: string
}

export interface GenerateImageResponse {
    created: number
    data: GeneratedImage[]
}

/**
 * Generate image(s) via an OpenAI-compatible images API.
 *
 * @param prompt - Text prompt for image generation
 * @param options - Optional generation parameters
 * @param baseUrl - Override the default media server URL
 * @returns Promise resolving to the API response
 */
export async function generateImage(
    prompt: string,
    options: GenerateImageOptions = {},
    baseUrl: string = getMediaServerUrl()
): Promise<GenerateImageResponse> {
    const { model, n = 1, size, quality } = options

    const body: Record<string, unknown> = { prompt, n }
    if (model) body.model = model
    if (size) body.size = size
    if (quality) body.quality = quality

    const resp = await fetch(`${baseUrl}/images/generations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })

    if (!resp.ok) {
        const errText = await resp.text().catch(() => "")
        throw new Error(
            `mediaServer: HTTP ${resp.status} ${resp.statusText}${errText ? ` — ${errText}` : ""
            }`
        )
    }

    return (await resp.json()) as GenerateImageResponse
}

export interface EditImageOptions extends GenerateImageOptions {
    input_fidelity?: "high" | "low"
}

export interface ImageRef {
    image_url: string
}

/**
 * Edit an existing image via the OpenAI-compatible /images/edits API.
 *
 * @param prompt - Text prompt describing the edit
 * @param inputImage - Base64 data URL of the input image
 * @param options - Optional edit parameters
 * @param baseUrl - Override the default media server URL
 * @returns Promise resolving to the API response
 */
export async function editImage(
    prompt: string,
    inputImage: string,
    options: EditImageOptions = {},
    baseUrl: string = getMediaServerUrl()
): Promise<GenerateImageResponse> {
    const { model, n = 1, size, quality, input_fidelity } = options

    const body: Record<string, unknown> = { prompt, n, images: [{ image_url: inputImage }] }
    if (model) body.model = model
    if (size) body.size = size
    if (quality) body.quality = quality
    if (input_fidelity) body.input_fidelity = input_fidelity

    const resp = await fetch(`${baseUrl}/images/edits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })

    if (!resp.ok) {
        const errText = await resp.text().catch(() => "")
        throw new Error(
            `mediaServer: HTTP ${resp.status} ${resp.statusText}${errText ? ` — ${errText}` : ""
            }`
        )
    }

    return (await resp.json()) as GenerateImageResponse
}

/**
 * Decode a base64 image string to a Blob.
 *
 * @param b64 - Base64-encoded image data (no data URI prefix)
 * @returns Promise resolving to a Blob
 */
export function b64ToBlob(b64: string, mimeType: string = "image/png"): Blob {
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return new Blob([bytes], { type: mimeType })
}
