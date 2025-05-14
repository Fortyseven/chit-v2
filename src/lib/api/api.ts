import { get, writable } from "svelte/store"
import { appState } from "../appState/appState"

export const pendingResponse = writable({
    role: "assistant",
    content: "",
})

export const pendingContinuedAssistantChat = writable(false)

export const wasAborted = writable(false)

/* ------------------------------------------------
 * Get the details of a model from the server.
 * @param {*} model_name
 * @returns {Promise} A promise that resolves to the model details.
 */
export async function OL_model_details(model_name: String) {
    try {
        const response = await fetch(
            `${get(appState).chatApiEndpoint}/api/show`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: model_name,
                }),
            }
        )

        let details = await response.json()

        return details
    } catch (err) {
        if (err instanceof Error) {
            console.error("OL_model_details error: ", err)
            throw Error("Error connecting to server: " + err.message)
        }
    }
}
