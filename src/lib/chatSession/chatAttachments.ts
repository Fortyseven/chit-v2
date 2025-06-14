import { getActiveChatId } from "./chatActions"
import { chats } from "./chatSession"

export enum ChatMediaType {
    IMAGE = "image",
    AUDIO = "audio",
    VIDEO = "video",
    TEXT = "text",
}

export interface MediaAttachment {
    id: string
    data: Blob | string
    type: ChatMediaType
    filename?: string
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
    filename: string = ""
): MediaAttachment {
    return {
        id: crypto.randomUUID(),
        data,
        type,
        filename,
    }
}

//--------------------------------------------------------------
export function chatAddPastedMedia(
    chatId: string = "",
    data: Blob | string,
    type: ChatMediaType,
    filename: string = ""
) {
    chatId = getActiveChatId(chatId)

    if (!chatId) throw new Error("chatAddPastedMedia: chatId is required")

    const newAttachment = createMediaAttachment(data, type, filename)

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
export function chatClearPastedMedia(chatId: string = "", id: string = "") {
    if (!id) throw new Error("chatClearPastedMedia: id is required")

    // remove the pasted media from the chat

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    pastedMedia: chat.pastedMedia
                        ? chat.pastedMedia.filter((media) => media.id !== id)
                        : [],
                }
            }
            return chat
        })
    )
}

//--------------------------------------------------------------
export function chatClearAllPastedMedia(chatId: string = "") {
    chatId = getActiveChatId(chatId)

    if (!chatId) throw new Error("chatClearAllPastedMedia: chatId is required")

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
