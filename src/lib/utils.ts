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

export function convertBase64ToBlob(base64: string): Blob {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray])
}

/****************************************************************************/
export function loadFile(types: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
        const input = document.createElement("input")
        input.type = "file"
        input.accept = types.join(",")
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement)?.files?.[0]
            if (!file) {
                reject(new Error("No file selected"))
                return
            }
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    resolve({ result: e.target?.result, file })
                } catch (error) {
                    reject(error)
                }
            }
            reader.onerror = () => reject(new Error("Error reading file"))
            if (file.type.startsWith("image/")) {
                reader.readAsArrayBuffer(file)
            } else {
                reader.readAsText(file)
            }
        }
        input.click()
    })
}
