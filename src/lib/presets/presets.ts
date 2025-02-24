import { get } from "svelte/store"
import { appState } from "../../appState/appState"
import {
    chatSetModel,
    chatSetSystemPrompt,
} from "../../chatSession/chatActions"

function _onHaveLoadedKobold(data) {
    const chat_id = get(appState).activeChatId

    if (!chat_id) {
        throw "Chat session not found: " + chat_id
    }

    chatSetSystemPrompt(chat_id, data.memory)
    chatSetModel(chat_id, data.savedsettings.model_name)

    // return state
}

export function loadPresetFromFile() {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e) => {
        const file = e.target.files[0]
        const reader = new FileReader()
        reader.onload = (e) => {
            const data = JSON.parse(e.target?.result)
            // $chatState.stateFilename = file.name
            _onHaveLoadedKobold(data)
        }
        reader.readAsText(file)
    }
    input.click()
}
