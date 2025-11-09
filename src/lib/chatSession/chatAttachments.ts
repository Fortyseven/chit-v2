import { getActiveChatId } from "./chatActions"
import { chats } from "./chatSession"
import { mediaStorage } from "./mediaStorage"

export enum ChatMediaType {
    IMAGE = "image",
    AUDIO = "audio",
    VIDEO = "video",
    TEXT = "text",
}

export interface MediaAttachment {
    id: string
    data: Blob | string // For backward compatibility and text data
    type: ChatMediaType
    filename?: string
    // For IndexedDB storage - if present, data should be retrieved from IndexedDB
    blobId?: string
    // Flag to indicate if this is stored in IndexedDB
    isStored?: boolean
}

export const MAX_DIMENSION = 1024

export function resizeImage(
    imageBlob: Blob,
    maxDimension: number
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")
            if (!ctx) {
                reject(new Error("Failed to get canvas context"))
                return
            }

            let width = img.width
            let height = img.height

            if (width > height) {
                if (width > maxDimension) {
                    height *= maxDimension / width
                    width = maxDimension
                }
            } else {
                if (height > maxDimension) {
                    width *= maxDimension / height
                    height = maxDimension
                }
            }

            // round dimensions to nearest integer
            width = Math.round(width)
            height = Math.round(height)

            console.log(
                `Resizing image from ${img.width}x${img.height} to ${width}x${height}`
            )
            canvas.width = width
            canvas.height = height
            ctx.drawImage(img, 0, 0, width, height)

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob)
                } else {
                    reject(new Error("Failed to convert canvas to blob"))
                }
            }, "image/jpeg")
        }
        img.onerror = (error) => reject(error)
        img.src = URL.createObjectURL(imageBlob)
    })
}

function createMediaAttachment(
    data: Blob | string,
    type: ChatMediaType,
    filename: string = "",
    blobId?: string,
    isStored: boolean = false
): MediaAttachment {
    return {
        id: crypto.randomUUID(),
        data,
        type,
        filename,
        blobId,
        isStored,
    }
}

//--------------------------------------------------------------
export async function chatAddPastedMedia(
    chatId: string = "",
    data: Blob | string,
    type: ChatMediaType,
    filename: string = ""
) {
    chatId = getActiveChatId(chatId)

    if (!chatId) throw new Error("chatAddPastedMedia: chatId is required")

    let newAttachment: MediaAttachment

    // If it's a Blob, store it in IndexedDB for persistence
    if (data instanceof Blob) {
        const blobId = crypto.randomUUID()

        try {
            await mediaStorage.storeMedia(blobId, chatId, data, filename)
            // Create attachment with reference to IndexedDB storage
            newAttachment = createMediaAttachment(
                "",
                type,
                filename,
                blobId,
                true
            )
        } catch (error) {
            console.error("Failed to store media in IndexedDB:", error)
            // Fallback to in-memory storage (will be lost on reload)
            newAttachment = createMediaAttachment(data, type, filename)
        }
    } else {
        // For string data, store directly (not in IndexedDB)
        newAttachment = createMediaAttachment(data, type, filename)
    }

    // add the pasted media to the chat
    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    pastedMedia: Array.isArray(chat.pastedMedia)
                        ? [...chat.pastedMedia, newAttachment]
                        : [newAttachment],
                }
            }
            return chat
        })
    )
}

//--------------------------------------------------------------
export async function chatClearPastedMedia(
    chatId: string = "",
    id: string = ""
) {
    if (!id) throw new Error("chatClearPastedMedia: id is required")

    // Find the media item to get its blobId for cleanup
    let mediaToRemove: MediaAttachment | undefined

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId && chat.pastedMedia) {
                const media = chat.pastedMedia.find((m) => m.id === id)
                if (media) {
                    mediaToRemove = media
                }
                return {
                    ...chat,
                    pastedMedia: chat.pastedMedia.filter(
                        (media) => media.id !== id
                    ),
                }
            }
            return chat
        })
    )

    // Clean up from IndexedDB if it was stored there
    if (mediaToRemove?.blobId && mediaToRemove.isStored) {
        try {
            await mediaStorage.deleteMedia(mediaToRemove.blobId)
        } catch (error) {
            console.error("Failed to delete media from IndexedDB:", error)
        }
    }
}

//--------------------------------------------------------------
export async function chatClearAllPastedMedia(chatId: string = "") {
    chatId = getActiveChatId(chatId)

    if (!chatId) throw new Error("chatClearAllPastedMedia: chatId is required")

    // Clean up all media from IndexedDB for this chat
    try {
        await mediaStorage.deleteChatMedia(chatId)
    } catch (error) {
        console.error("Failed to delete chat media from IndexedDB:", error)
    }

    // remove all pasted media from the chat
    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    pastedMedia: [],
                }
            }
            return chat
        })
    )
}

// Cache for media blobs to avoid repeated IndexedDB calls
const mediaBlobCache = new Map<string, Promise<Blob | string>>()

//--------------------------------------------------------------
/**
 * Retrieve the actual blob data for a media attachment
 * This is needed when the media is stored in IndexedDB
 */
export async function getMediaBlob(
    attachment: MediaAttachment
): Promise<Blob | string> {
    // If it's stored in IndexedDB, retrieve from there
    if (attachment.isStored && attachment.blobId) {
        // Check cache first to avoid duplicate IndexedDB calls
        if (mediaBlobCache.has(attachment.blobId)) {
            return mediaBlobCache.get(attachment.blobId)!
        }

        const retrievalPromise = (async () => {
            try {
                const blob = await mediaStorage.getMedia(attachment.blobId!)
                if (blob && blob instanceof Blob) {
                    return blob
                } else {
                    console.warn(
                        `Media blob ${attachment.blobId} not found in IndexedDB`
                    )
                    // Don't fall back to attachment.data if it's empty - that's expected for IndexedDB storage
                    if (attachment.data && attachment.data !== "") {
                        return attachment.data
                    }
                    throw new Error(
                        `Media blob not found: ${attachment.blobId}`
                    )
                }
            } catch (error) {
                console.error("Failed to retrieve media from IndexedDB:", error)
                // Don't fall back to attachment.data if it's empty - that's expected for IndexedDB storage
                if (attachment.data && attachment.data !== "") {
                    return attachment.data
                }
                throw error
            }
        })()

        // Cache the promise to prevent duplicate calls
        mediaBlobCache.set(attachment.blobId, retrievalPromise)

        // Clean up cache after some time to prevent memory leaks
        setTimeout(() => {
            mediaBlobCache.delete(attachment.blobId!)
        }, 60000) // 1 minute

        return retrievalPromise
    }

    // Return the direct data for non-IndexedDB media
    return attachment.data
}
