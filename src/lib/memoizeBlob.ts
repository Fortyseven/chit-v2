const blobURLCache = new Map<Blob, string>()

const BLOB_TIMEOUT = 30000 // 30 seconds

/**
 * Memoizes the blob URL for a given blob.
 * If the blob URL already exists, it returns the cached URL.
 * Otherwise, it creates a new blob URL and caches it.
 * The blob URL is revoked after a specified timeout.
 *
 * @param blob
 */
export function memoizeBlobUrl(blob: Blob) {
    if (blobURLCache.has(blob)) {
        return blobURLCache.get(blob)
    } else {
        if (blob && blob instanceof Blob) {
            // cache miss
            const blobUrl = URL.createObjectURL(blob)
            blobURLCache.set(blob, blobUrl)

            setTimeout(() => {
                // release the blob url after N seconds
                if (blobURLCache.has(blob)) {
                    const blobUrl = blobURLCache.get(blob)
                    if (blobUrl) {
                        URL.revokeObjectURL(blobUrl)
                    }
                    blobURLCache.delete(blob)
                }
            }, BLOB_TIMEOUT)

            return blobUrl
        } else {
            console.error("Invalid blob passed to memoizeBlobUrl")
            return null
        }
    }
}
