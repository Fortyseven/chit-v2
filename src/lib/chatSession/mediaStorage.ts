/**
 * IndexedDB-based media storage for chat sessions
 * Stores media blobs persistently and provides cleanup functionality
 */

export interface StoredMediaItem {
    id: string
    chatId: string
    blob: Blob
    filename?: string
    timestamp: number
}

class MediaStorageDB {
    private dbName = "ChatMediaStorage"
    private dbVersion = 1
    private storeName = "media"
    private db: IDBDatabase | null = null
    private initPromise: Promise<void> | null = null

    constructor() {
        if (typeof window !== "undefined") {
            this.initPromise = this.init()
        }
    }

    private init(): Promise<void> {
        return new Promise((resolve, reject) => {
            // We don't specify a version here initially, to check existence first
            const request = indexedDB.open(this.dbName)

            request.onerror = (event) => {
                console.error("Failed to open IndexedDB:", request.error)
                reject(request.error)
            }

            request.onsuccess = (event) => {
                this.db = request.result
                const currentVersion = this.db.version

                if (this.db.objectStoreNames.contains(this.storeName)) {
                    // Everything is fine, just resolve
                    console.debug("Media storage initialized")
                    resolve()
                } else {
                    // Object store is missing, we need to trigger an upgrade
                    console.warn(
                        `Object store '${this.storeName}' not found. Triggering DB upgrade.`
                    )
                    this.db.close() // Must close before upgrading

                    const newVersion =
                        Math.max(currentVersion, this.dbVersion) + 1
                    const upgradeRequest = indexedDB.open(
                        this.dbName,
                        newVersion
                    )

                    upgradeRequest.onupgradeneeded = (upgradeEvent) => {
                        const db = (upgradeEvent.target as IDBOpenDBRequest)
                            .result
                        if (!db.objectStoreNames.contains(this.storeName)) {
                            console.log(
                                `Creating object store: ${this.storeName}`
                            )
                            const store = db.createObjectStore(this.storeName, {
                                keyPath: "id",
                            })
                            store.createIndex("chatId", "chatId", {
                                unique: false,
                            })
                        }
                    }

                    upgradeRequest.onsuccess = () => {
                        this.db = upgradeRequest.result
                        console.debug("Media storage re-initialized")
                        resolve()
                    }

                    upgradeRequest.onerror = () => {
                        console.error(
                            "Failed to upgrade IndexedDB:",
                            upgradeRequest.error
                        )
                        reject(upgradeRequest.error)
                    }
                }
            }
        })
    }

    private async ensureDB(): Promise<IDBDatabase> {
        if (this.initPromise) {
            await this.initPromise
        }
        if (!this.db) {
            throw new Error("Database not initialized.")
        }
        return this.db
    }

    /**
     * Store a media blob for a specific chat session
     */
    async storeMedia(
        id: string,
        chatId: string,
        blob: Blob,
        filename?: string
    ): Promise<void> {
        const db = await this.ensureDB()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], "readwrite")
            const store = transaction.objectStore(this.storeName)

            const mediaItem: StoredMediaItem = {
                id,
                chatId,
                blob,
                filename,
                timestamp: Date.now(),
            }

            const request = store.put(mediaItem)

            request.onsuccess = () => {
                console.debug(`Stored media ${id} for chat ${chatId}`)
                resolve()
            }

            request.onerror = () => {
                console.error(`Failed to store media ${id}:`, request.error)
                reject(request.error)
            }
        })
    }

    /**
     * Retrieve a media blob by ID
     */
    async getMedia(id: string): Promise<Blob | null> {
        const db = await this.ensureDB()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], "readonly")
            const store = transaction.objectStore(this.storeName)
            const request = store.get(id)

            request.onsuccess = () => {
                const result = request.result as StoredMediaItem | undefined
                resolve(result?.blob || null)
            }

            request.onerror = () => {
                console.error(`Failed to retrieve media ${id}:`, request.error)
                reject(request.error)
            }
        })
    }

    /**
     * Get all media items for a specific chat session
     */
    async getChatMedia(chatId: string): Promise<StoredMediaItem[]> {
        const db = await this.ensureDB()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], "readonly")
            const store = transaction.objectStore(this.storeName)
            const index = store.index("chatId")
            const request = index.getAll(chatId)

            request.onsuccess = () => {
                resolve(request.result as StoredMediaItem[])
            }

            request.onerror = () => {
                console.error(
                    `Failed to retrieve media for chat ${chatId}:`,
                    request.error
                )
                reject(request.error)
            }
        })
    }

    /**
     * Delete a specific media item
     */
    async deleteMedia(id: string): Promise<void> {
        const db = await this.ensureDB()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], "readwrite")
            const store = transaction.objectStore(this.storeName)
            const request = store.delete(id)

            request.onsuccess = () => {
                console.debug(`Deleted media ${id}`)
                resolve()
            }

            request.onerror = () => {
                console.error(`Failed to delete media ${id}:`, request.error)
                reject(request.error)
            }
        })
    }

    /**
     * Delete all media for a specific chat session
     * CRITICAL: This must be called when a chat is cleared or deleted
     */
    async deleteChatMedia(chatId: string): Promise<void> {
        const db = await this.ensureDB()

        return new Promise(async (resolve, reject) => {
            try {
                // First get all media IDs for this chat
                const mediaItems = await this.getChatMedia(chatId)

                if (mediaItems.length === 0) {
                    resolve()
                    return
                }

                const transaction = db.transaction(
                    [this.storeName],
                    "readwrite"
                )
                const store = transaction.objectStore(this.storeName)

                let deletedCount = 0
                const totalCount = mediaItems.length

                for (const item of mediaItems) {
                    const deleteRequest = store.delete(item.id)

                    deleteRequest.onsuccess = () => {
                        deletedCount++
                        if (deletedCount === totalCount) {
                            console.debug(
                                `Deleted ${deletedCount} media items for chat ${chatId}`
                            )
                            resolve()
                        }
                    }

                    deleteRequest.onerror = () => {
                        console.error(
                            `Failed to delete media ${item.id}:`,
                            deleteRequest.error
                        )
                        reject(deleteRequest.error)
                    }
                }
            } catch (error) {
                console.error(
                    `Failed to delete chat media for ${chatId}:`,
                    error
                )
                reject(error)
            }
        })
    }

    /**
     * Get storage statistics
     */
    async getStorageStats(): Promise<{
        totalItems: number
        totalSize: number
    }> {
        const db = await this.ensureDB()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], "readonly")
            const store = transaction.objectStore(this.storeName)
            const request = store.getAll()

            request.onsuccess = () => {
                const items = request.result as StoredMediaItem[]
                const totalSize = items.reduce(
                    (sum, item) => sum + item.blob.size,
                    0
                )

                resolve({
                    totalItems: items.length,
                    totalSize,
                })
            }

            request.onerror = () => {
                console.error("Failed to get storage stats:", request.error)
                reject(request.error)
            }
        })
    }

    /**
     * Clean up old media items (optional - for housekeeping)
     */
    async cleanupOldMedia(
        maxAge: number = 30 * 24 * 60 * 60 * 1000
    ): Promise<number> {
        const db = await this.ensureDB()
        const cutoffTime = Date.now() - maxAge

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], "readwrite")
            const store = transaction.objectStore(this.storeName)
            const request = store.getAll()

            request.onsuccess = () => {
                const items = request.result as StoredMediaItem[]
                const oldItems = items.filter(
                    (item) => item.timestamp < cutoffTime
                )

                if (oldItems.length === 0) {
                    resolve(0)
                    return
                }

                let deletedCount = 0
                for (const item of oldItems) {
                    const deleteRequest = store.delete(item.id)
                    deleteRequest.onsuccess = () => {
                        deletedCount++
                        if (deletedCount === oldItems.length) {
                            console.debug(
                                `Cleaned up ${deletedCount} old media items`
                            )
                            resolve(deletedCount)
                        }
                    }
                }
            }

            request.onerror = () => {
                console.error("Failed to cleanup old media:", request.error)
                reject(request.error)
            }
        })
    }

    /**
     * Validate that media items exist for the given attachment IDs
     * Returns a list of valid attachment IDs
     */
    async validateMediaReferences(attachmentIds: string[]): Promise<string[]> {
        if (attachmentIds.length === 0) return []

        const db = await this.ensureDB()
        const validIds: string[] = []

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], "readonly")
            const store = transaction.objectStore(this.storeName)

            let processed = 0

            for (const id of attachmentIds) {
                const request = store.get(id)

                request.onsuccess = () => {
                    if (request.result) {
                        validIds.push(id)
                    } else {
                        console.warn(
                            `Media attachment ${id} not found in IndexedDB`
                        )
                    }

                    processed++
                    if (processed === attachmentIds.length) {
                        resolve(validIds)
                    }
                }

                request.onerror = () => {
                    console.error(
                        `Failed to validate media ${id}:`,
                        request.error
                    )
                    processed++
                    if (processed === attachmentIds.length) {
                        resolve(validIds)
                    }
                }
            }

            if (attachmentIds.length === 0) {
                resolve(validIds)
            }
        })
    }

    /**
     * Clean up orphaned media (media not referenced by any active chat)
     */
    async cleanupOrphanedMedia(activeChatIds: string[]): Promise<number> {
        const db = await this.ensureDB()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], "readwrite")
            const store = transaction.objectStore(this.storeName)
            const request = store.getAll()

            request.onsuccess = () => {
                const allItems = request.result as StoredMediaItem[]
                const orphanedItems = allItems.filter(
                    (item) => !activeChatIds.includes(item.chatId)
                )

                if (orphanedItems.length === 0) {
                    resolve(0)
                    return
                }

                let deletedCount = 0
                for (const item of orphanedItems) {
                    const deleteRequest = store.delete(item.id)
                    deleteRequest.onsuccess = () => {
                        deletedCount++
                        if (deletedCount === orphanedItems.length) {
                            console.debug(
                                `Cleaned up ${deletedCount} orphaned media items`
                            )
                            resolve(deletedCount)
                        }
                    }
                }
            }

            request.onerror = () => {
                console.error(
                    "Failed to cleanup orphaned media:",
                    request.error
                )
                reject(request.error)
            }
        })
    }
}

// Singleton instance
const mediaStorage = new MediaStorageDB()

export { mediaStorage }
