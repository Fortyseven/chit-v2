import { toast } from "@zerodevx/svelte-toast"
import yaml from "js-yaml"
import { get } from "svelte/store"
import llm from "../../lib/llm/ollama"
import { appState } from "../appState/appState"
import {
    chatSetModel,
    chatSetSystemPrompt,
    chatUpdateSettings,
    DEFAULT_CONTEXT,
    DEFAULT_TEMPERATURE,
} from "../chatSession/chatActions"
/* ------------------------------------------------ */
interface Variables {
    char: string
    user: string
}

interface Options {
    temperature: number
    num_ctx: number
    // top_k: number
    // top_p: number
    // rep_pen: number
    // num_predict: number
    // max_context_length: number
    // repeat_last_n: number
    // mirostat: number
    // mirostat_eta: number
    // mirostat_tau: number
    // repeat_penalty: number
    // seed: number
    // tfs_z: number
}

interface Config {
    system_prompt: string
    model_name: string
    variables: Variables
    options: Options
}

const defaults: Config = {
    system_prompt: "",
    model_name: "",
    variables: {
        char: "Assistant",
        user: "User",
    },
    options: {
        temperature: DEFAULT_TEMPERATURE,
        num_ctx: DEFAULT_CONTEXT,
    },
}

/* ------------------------------------------------ */
function _modelAvailable(model_name: string) {
    const models = get(get(llm).models)

    const has_model = models.find((m) => m.name === model_name)
    return has_model
}

function _legacyLoadJSON(content: string) {
    let prompt = undefined
    let model = undefined
    let settings = {}

    const data = JSON.parse(content)

    if (data.memory) {
        prompt = data.memory
    }

    const target_model = data.savedsettings?.model_name

    if (target_model) {
        model = target_model
    }

    if (data.savedsettings?.temperature) {
        const temperature = parseFloat(data.savedsettings.temperature)
        if (!isNaN(temperature)) {
            settings = {
                ...settings,
                temperature: temperature,
            }
        }
    }

    return {
        prompt,
        model,
        settings,
    }
}

/* ------------------------------------------------ */

function _loadYAML(content: string) {
    // assume new YAML format
    const data = yaml.load(content) as Config
    let prompt = undefined
    let model = undefined
    let settings = {}

    // populate templated vars
    // TODO: later, make these defaults and let user override in front-end
    // if (data.variables) {
    //     for (const [key, value] of Object.entries(data.variables)) {
    //         if (typeof value === "string") {
    //             data.system_prompt = data.system_prompt.replace(
    //                 `{{${key}}}`,
    //                 value
    //             )
    //         } else {
    //             console.warn("(IGNORED) Invalid variable type: " + key)
    //         }
    //     }
    // }

    if (data.system_prompt) {
        prompt = data.system_prompt
    }

    if (data.model_name) {
        model = data.model_name
    }
}

/* ------------------------------------------------ */
function _doParsePreset(content: string, filename: string = "") {
    const target_chat_id = get(appState).activeChatId

    let prompt = undefined
    let model = undefined
    let settings = {}

    if (!target_chat_id) {
        throw "Chat session not found: " + target_chat_id
    }

    if (filename.endsWith(".json")) {
        ;({ prompt, model, settings } = _legacyLoadJSON(content))
    } else if (filename.endsWith(".txt")) {
        // this is intended to only load a system prompt; this isn't
        // really a typical use case, but it is supported because it's
        // super simple and why the fuck not?
        prompt = content
    } else {
        _loadYAML(content)
    }

    // now let's pull it together

    if (prompt) {
        console.info("Prompt found: " + prompt)
        chatSetSystemPrompt(target_chat_id, prompt)
    }

    if (model) {
        if (model && _modelAvailable(model)) {
            console.info("Model found: " + model)
            chatSetModel(target_chat_id, model)
        } else {
            const msg = `Model not found: ${model}. Using default model.`

            console.warn(msg)
            toast.push(msg)
        }
    }

    if (settings) {
        console.info("Settings found: " + JSON.stringify(settings))
        chatUpdateSettings(target_chat_id, settings)
    }

    return prompt
}

/* ------------------------------------------------ */
export function loadPresetFromFile() {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json,.yml,.yaml,.txt"
    input.onchange = (e) => {
        const file = e.target.files[0]
        const reader = new FileReader()
        reader.onload = (e) => {
            return _doParsePreset(e.target?.result, file.name)
        }
        reader.readAsText(file)
    }
    input.click()
}
