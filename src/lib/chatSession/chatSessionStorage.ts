/**
 * IndexedDB-based storage for chat sessions.
 * Replaces localStorage for chat persistence to avoid
 * serializing the entire chat array on every mutation.
 */

import type { ChatSession } from "./chatSession"

class ChatSessionStorageDB {
    private dbName = "ChatSessionStorage"
    private dbVersion = 1
    private storeName = "sessions"
    private db: IDBDatabase | null = null
    private initPromise: Promise<void> | null = null

    constructor() {
        if (typeof window !== "undefined") {
            this.initPromise = this.init()
        }
    }

    private init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion)

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: "id" })
                }
            }

            request.onsuccess = () => {
                this.db = request.result
                console.debug("Chat session storage initialized")
                resolve()
            }

            request.onerror = () => {
                console.error(
                    "Failed to open chat session IndexedDB:",
                    request.error
                )
                reject(request.error)
            }
        })
    }

    private async ensureDB(): Promise<IDBDatabase> {
        if (this.initPromise) {
            await this.initPromise
        }
        if (!this.db) {
            throw new Error("Chat session database not initialized.")
        }
        return this.db
    }

    /**
     * Store a single chat session
     */
    async storeChat(chat: ChatSession): Promise<void> {
        const db = await this.ensureDB()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], "readwrite")
            const store = transaction.objectStore(this.storeName)
            const request = store.put(chat)

            request.onsuccess = () => resolve()
            request.onerror = () => {
                console.error(
                    `Failed to store chat ${chat.id}:`,
                    request.error
                )
                reject(request.error)
            }
        })
    }

    /**
     * Store multiple chat sessions in a single transaction
     */
    async storeAllChats(chatList: ChatSession[]): Promise<void> {
        const db = await this.ensureDB()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], "readwrite")
            const store = transaction.objectStore(this.storeName)

            for (const chat of chatList) {
                store.put(chat)
            }

            transaction.oncomplete = () => resolve()
            transaction.onerror = () => {
                console.error(
                    "Failed to store chats batch:",
                    transaction.error
                )
                reject(transaction.error)
            }
        })
    }

    /**
     * Get all stored chat sessions
     */
    async getAllChats(): Promise<ChatSession[]> {
        const db = await this.ensureDB()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], "readonly")
            const store = transaction.objectStore(this.storeName)
            const request = store.getAll()

            request.onsuccess = () => {
                resolve(request.result as ChatSession[])
            }

            request.onerror = () => {
                console.error("Failed to get all chats:", request.error)
                reject(request.error)
            }
        })
    }

    /**
     * Get a single chat session by ID
     */
    async getChat(id: string): Promise<ChatSession | null> {
        const db = await this.ensureDB()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], "readonly")
            const store = transaction.objectStore(this.storeName)
            const request = store.get(id)

            request.onsuccess = () => {
                resolve((request.result as ChatSession) || null)
            }

            request.onerror = () => {
                console.error(`Failed to get chat ${id}:`, request.error)
                reject(request.error)
            }
        })
    }

    /**
     * Delete a single chat session by ID
     */
    async deleteChat(id: string): Promise<void> {
        const db = await this.ensureDB()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], "readwrite")
            const store = transaction.objectStore(this.storeName)
            const request = store.delete(id)

            request.onsuccess = () => resolve()
            request.onerror = () => {
                console.error(
                    `Failed to delete chat ${id}:`,
                    request.error
                )
                reject(request.error)
            }
        })
    }

    /**
     * Clear all stored sessions
     */
    async clear(): Promise<void> {
        const db = await this.ensureDB()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], "readwrite")
            const store = transaction.objectStore(this.storeName)
            const request = store.clear()

            request.onsuccess = () => resolve()
            request.onerror = () => {
                console.error("Failed to clear chat storage:", request.error)
                reject(request.error)
            }
        })
    }
}

export const chatSessionStorage = new ChatSessionStorageDB()

// Track which chats have been unloaded (messages stripped from store but still in IDB)
export const unloadedChatIds: Set<string> = new Set()

/**
 * Load messages for a specific chat from IndexedDB into the store.
 * Used when switching to a chat whose messages aren't loaded yet.
 */
export async function loadChatMessages(chatId: string): Promise<void> {
    // Inline ensureMessageIds to avoid importing from chatStorage
    function ensureIds(messages: any[]) {
        return messages.map((msg: any) => ({
            ...msg,
            id: msg.id || crypto.randomUUID(),
        }))
    }

    try {
        const fullChat = await chatSessionStorage.getChat(chatId)
        if (!fullChat) return

        const messages = ensureIds(fullChat.messages || [])

        unloadedChatIds.delete(chatId)

        const { chats } = await import("./chatSession")
        chats.update(($chats) =>
            $chats.map((chat) => {
                if (chat.id === chatId) {
                    return { ...chat, messages }
                }
                return chat
            })
        )
    } catch (e) {
        console.error(`Failed to load messages for chat ${chatId}:`, e)
    }
}

/**
 * Unload messages for a chat from the store (they remain in IndexedDB).
 * Called when switching away from a chat to free memory.
 */
export async function unloadChatMessages(chatId: string): Promise<void> {
    unloadedChatIds.add(chatId)
    const { chats } = await import("./chatSession")
    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return { ...chat, messages: [] }
            }
            return chat
        })
    )
}