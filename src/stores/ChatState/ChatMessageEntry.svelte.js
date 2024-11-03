export class ChatMessageEntry {
    role = $state()
    text = $state("zzz")

    constructor(role, text) {
        this.role = role
        this.text = text

        console.log(`created ${role} message: ${text}`)
    }
}
