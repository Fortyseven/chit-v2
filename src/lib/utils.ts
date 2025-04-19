/******************************************************************************
 * Converts a Blob to a base64 string.
 *
 * @param {Blob} blob - The Blob to convert to a base64 string.
 * @return {Promise<string>} A Promise that resolves to the base64 string.
 ******************************************************************************/
export function convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            const base64String = reader.result?.toString().split(",")[1]
            resolve(base64String || "")
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}
