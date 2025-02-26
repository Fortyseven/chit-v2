import yaml from "js-yaml"
import { get } from "svelte/store"
import { appState } from "../../appState/appState"
import {
    chatSetModel,
    chatSetSystemPrompt,
} from "../../chatSession/chatActions"

/* ------------------------------------------------ */
interface Variables {
    char: string
    user: string
}

interface Options {
    temperature: number
    top_k: number
    top_p: number
    rep_pen: number
    num_predict: number
    max_context_length: number
    repeat_last_n: number
    mirostat: number
    mirostat_eta: number
    mirostat_tau: number
    repeat_penalty: number
    seed: number
    tfs_z: number
}

interface Config {
    system_prompt: string
    model_name: string
    variables: Variables
    options: Options
}

/* ------------------------------------------------ */
function _doParsePreset(content: string, filename: string = "") {
    if (filename.endsWith(".json")) {
        // assume Kobold preset (legacy import)
        const data = JSON.parse(e.target?.result)
        const chat_id = get(appState).activeChatId

        if (!chat_id) {
            throw "Chat session not found: " + chat_id
        }

        chatSetSystemPrompt(chat_id, data.memory)
        chatSetModel(chat_id, data.savedsettings.model_name)
    } else {
        // assume new YAML format
        const data = yaml.load(content) as Config
        const chat_id = get(appState).activeChatId

        if (!chat_id) {
            throw "Chat session not found: " + chat_id
        }

        // populate templated vars
        // TODO: later, make these defaults and let user override in front-end
        if (data.variables) {
            for (const [key, value] of Object.entries(data.variables)) {
                if (typeof value === "string") {
                    data.system_prompt = data.system_prompt.replace(
                        `{{${key}}}`,
                        value
                    )
                } else {
                    console.warn("(IGNORED) Invalid variable type: " + key)
                }
            }
        }

        if (data.system_prompt) {
            chatSetSystemPrompt(chat_id, data.system_prompt)
        }

        if (data.model_name) {
            chatSetModel(chat_id, data.model_name)
        }
    }
}

/* ------------------------------------------------ */
export function loadPresetFromFile() {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json,.yml,.yaml"
    input.onchange = (e) => {
        const file = e.target.files[0]
        const reader = new FileReader()
        reader.onload = (e) => {
            _doParsePreset(e.target?.result, file.name)
        }
        reader.readAsText(file)
    }
    input.click()
}
