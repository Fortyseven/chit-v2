class chatMessageEntry {
    role = $state()
    text = $state("zzz")

    constructor(role, text) {
        this.role = role
        this.text = text

        console.log(`created ${role} message: ${text}`)
    }
}

class chatKnobsState {
    temperature = $state(0.7)
    num_ctx = $state(2048)
    mirostat = $state(0)
    mirostat_eta = $state(0.1)
    mirostat_tau = $state(5.0)
    num_predict = $state(-1)
    repeat_last_n = $state(64)
    repeat_penalty = $state(1.1)
    seed = $state(-1)
    // stop= $state(string[];
    tfs_z = $state(1.0)
    top_k = $state(40)
    top_p = $state(0.9)
}

class chatState {
    knobs = new chatKnobsState()
    system_prompt = $state("")
    variables = $state({})
    timeline = $state([])

    pushUserMessage = (message) => {
        this.timeline.push(new chatMessageEntry("user", message))
    }

    pushAssistantMessage = (message) => {
        this.timeline.push(new chatMessageEntry("assistant", message))
        console.log(`pushed ${message}`, this.timeline)
    }

    constructor(suffix) {
        this.pushUserMessage("Hello! " + suffix)
        this.pushAssistantMessage("What is up, my dude? " + suffix)
        this.pushUserMessage(
            "Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling,  " +
                suffix
        )
        this.pushAssistantMessage("Cool cool " + suffix)
        this.pushUserMessage("Hello! " + suffix)
        this.pushAssistantMessage("What is up, my dude? " + suffix)
        this.pushUserMessage(
            "Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling,  " +
                suffix
        )
        this.pushAssistantMessage("Cool cool " + suffix)
        this.pushUserMessage("Hello! " + suffix)
        this.pushAssistantMessage("What is up, my dude? " + suffix)
        this.pushUserMessage(
            "Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling,  " +
                suffix
        )
        this.pushAssistantMessage("Cool cool " + suffix)
    }
}

class ChatSession {
    chat_id = $state(Math.floor(Math.random() * 100000))
    title = $state("Untitled Chat " + this.chat_id)
    chatState = new chatState(this.chat_id)

    constructor() {
        console.log(`created chat session ${this.title}`)
    }
}

class Convos {
    entries = $state([new ChatSession(), new ChatSession()])

    rm(index) {
        this.entries.splice(index, 1)
    }

    constructor() {
        console.log("created convos")
    }
}

export const convos = $state(new Convos())
