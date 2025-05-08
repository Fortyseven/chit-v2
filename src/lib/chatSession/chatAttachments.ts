import { get, writable } from "svelte/store"
import { appState } from "../appState/appState"
import { getActiveChatId } from "./chatActions"
import { chats, Message } from "./chatSession"

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
}

function createMediaAttachment(
    data: Blob | string,
    type: ChatMediaType
): MediaAttachment {
    return {
        id: crypto.randomUUID(),
        data,
        type,
    }
}

//--------------------------------------------------------------
export function chatAddPastedMedia(
    chatId: String = "",
    data: Blob | string,
    type: ChatMediaType
) {
    // dump the first 100 bytes of the blob as hex/ascii

    // if (data instanceof Blob) {
    //     const reader = new FileReader()
    //     reader.onload = (e) => {
    //         const arrayBuffer = e.target?.result as ArrayBuffer
    //         const uint8Array = new Uint8Array(arrayBuffer)
    //         const hexString = Array.from(uint8Array)
    //             .slice(0, 100)
    //             .map((byte) => byte.toString(16).padStart(2, "0"))
    //             .join(" ")
    //         const asciiString = Array.from(uint8Array)
    //             .slice(0, 100)
    //             .map((byte) =>
    //                 byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : "."
    //             )
    //             .join("")
    //         console.log("Blob data (hex):", hexString)
    //         console.log("Blob data (ascii):", asciiString)
    //     }
    //     reader.readAsArrayBuffer(data)
    // }

    chatId = getActiveChatId(chatId)

    if (!chatId) throw new Error("chatAddPastedMedia: chatId is required")

    const newAttachment = createMediaAttachment(data, type)

    // add the pasted media to the chat
    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    pastedMedia: Array.isArray(chat.pastedMedia)
                        ? [...chat.pastedMedia, newAttachment]
                        : [newAttachment],
                    updatedAt: new Date(),
                }
            }
            return chat
        })
    )
}

//--------------------------------------------------------------
export function chatClearPastedMedia(chatId: String = "", id: String = "") {
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
                    updatedAt: new Date(),
                }
            }
            return chat
        })
    )
}

//--------------------------------------------------------------
export function chatClearAllPastedMedia(chatId: String = "") {
    chatId = getActiveChatId(chatId)

    if (!chatId) throw new Error("chatClearAllPastedMedia: chatId is required")

    // remove all pasted media from the chat
    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    pastedMedia: [],
                    updatedAt: new Date(),
                }
            }
            return chat
        })
    )
}
