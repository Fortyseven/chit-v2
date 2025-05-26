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
    chatId: String = "",
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
                }
            }
            return chat
        })
    )
}
