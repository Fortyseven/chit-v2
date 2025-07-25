import { toast } from "@zerodevx/svelte-toast"
import yaml from "js-yaml"
import { get } from "svelte/store"
import llm from "../../lib/llm/ollama"
import { appActiveChat, appState } from "../appState/appState"
import {
    chatFind,
    chatSetModel,
    chatSetSystemPrompt,
    chatUpdateSettings,
    DEFAULT_CONTEXT,
    DEFAULT_TEMPERATURE,
} from "../chatSession/chatActions"
import { loadFile } from "../utils"
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
function _loadMD(content: string) {
    let prompt = undefined
    let model = undefined
    let settings = {}

    console.log("Loading markdown preset...")

    // the body of the markdown file is the system prompt
    // if there is a YAML front-matter, we will use that
    // to set the model and settings
    const frontMatter = content.match(/---\n([\s\S]+?)\n---/)

    if (frontMatter) {
        const yamlContent = frontMatter[1]
        const data = yaml.load(yamlContent) as Config

        console.log("Front matter found: ", data)
        // populate templated vars
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
            prompt = data.system_prompt
        }
        if (data.model_name) {
            model = data.model_name
        }
        if (data.options) {
            settings = {
                ...settings,
                ...data.options,
            }
        }
    }

    prompt = prompt || content.replace(/---\n[\s\S]+?\n---/, "").trim()

    return {
        prompt,
        model,
        settings,
    }
}

/* ------------------------------------------------ */

function _loadYAML(content: string) {
    // assume new YAML format
    let prompt = undefined
    let model = undefined
    let settings = {}

    const data = yaml.load(content) as Config

    // populate templated vars
    // TODO: later, make these defaults and let user override in front-end
    // if (data.variables) {
    //     for (const [key, value] of Object.entries(data.variables)) {
    //         if (typeof value === "string") {
    //             data.systemPrompt = data.systemPrompt.replace(
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

    if (data.options) {
        settings = {
            ...settings,
            ...data.options,
        }
    }

    return {
        prompt,
        model,
        settings,
    }
}

/* ------------------------------------------------ */
function _doParsePreset(content: string, filename: string = "") {
    const target_chat_id = get(appState).activeChatId

    let sprompt = undefined
    let model = undefined
    let settings = {}

    if (!target_chat_id) {
        throw "Chat session not found: " + target_chat_id
    }

    if (filename.endsWith(".json")) {
        ;({ prompt: sprompt, model, settings } = _legacyLoadJSON(content))
    } else if (filename.endsWith(".txt")) {
        // this is intended to only load a system prompt; this isn't
        // really a typical use case, but it is supported because it's
        // super simple and why the fuck not?
        sprompt = content
    } else if (filename.endsWith(".yml") || filename.endsWith(".md")) {
        ;({ prompt: sprompt, model, settings } = _loadMD(content))
    } else if (filename.endsWith(".yml") || filename.endsWith(".yaml")) {
        ;({ prompt: sprompt, model, settings } = _loadYAML(content))
    } else {
        console.error("Unsupported file type")
        toast.push("Unsupported file type: " + filename)
    }

    // now let's pull it together ------------------------------

    if (sprompt) {
        chatSetSystemPrompt(target_chat_id, sprompt)
    } else {
        console.info("No system prompt specified")
        toast.push("No system prompt specified")
    }

    // --

    if (model) {
        if (model && _modelAvailable(model)) {
            console.info("Model found: " + model)
            chatSetModel(target_chat_id, model)
        } else {
            const msg = `Model not found: ${model}. Using default model.`

            console.warn(msg)
            toast.push(msg)
        }
    } else {
        console.info("No model specified")
        toast.push("No model specified")
    }

    // --

    if (Object.keys(settings)?.length) {
        chatUpdateSettings(target_chat_id, settings)
    } else {
        console.info("No settings specified")
        toast.push("No settings specified")
    }

    return sprompt
}

/* ------------------------------------------------ */
export async function loadPresetFromFile() {
    const { result, file } = await loadFile([
        ".json",
        ".yml",
        ".yaml",
        ".txt",
        ".md",
    ])

    return _doParsePreset(result, file.name)
}

/* ------------------------------------------------ */
/* -- SAVE ---------------------------------------- */
/* ------------------------------------------------ */

export function savePresetToFile() {
    const target_chat_id = get(appState).activeChatId

    if (!target_chat_id) {
        throw "Chat session not found: " + target_chat_id
    }

    const active_chat_id = get(appActiveChat)

    const chat = chatFind(active_chat_id)

    const data = {
        systemPrompt: chat?.systemPrompt,
        model_name: chat?.model_name,
        // variables: chat.variables,
        options: chat?.settings,
    }

    // FIXME: should we be asking the user for a base filename?
    // previous versions kept a unique name for each preset, but
    // we don't do that anymore... for now, guid is fine; let
    // them rename it if they want to
    const filename = `${target_chat_id}.yaml`

    const blob = new Blob([yaml.dump(data)], { type: "text/yaml" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
}
