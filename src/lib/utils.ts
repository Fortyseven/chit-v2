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

export function loadFile(types: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
        const input = document.createElement("input")
        input.type = "file"
        input.accept = types.join(",")
        input.onchange = (e) => {
            const file = e?.target?.files[0]
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
            reader.readAsText(file)
        }
        input.click()
    })
}
