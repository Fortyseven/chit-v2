import { get, writable } from "svelte/store"
import { appState } from "../../chatSession/appState.js"

export const pendingResponse = writable({
    role: "assistant",
    content: "",
})
export const responseInProgress = writable(false)
export const pendingContinuedAssistantChat = writable(false)

export const wasAborted = writable(false)

/* ------------------------------------------------
 * Get the details of a model from the server.
 * @param {*} model_name
 * @returns {Promise} A promise that resolves to the model details.
 */
export async function OL_model_details(model_name: String) {
    try {
        const response = await fetch(`${get(appState).apiEndpoint}/api/show`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: model_name,
            }),
        })

        let details = await response.json()

        return details
    } catch (err) {
        console.error("OL_model_details error: ", err)
        throw Error("Error connecting to server: " + err.message)
    }
}
