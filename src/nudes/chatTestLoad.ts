import { ChatSession, Message, activeChatId, chats } from "./chatSession"

export function populateTestData(reset = true) {
    const testChats: Array<ChatSession> = []
    const baseDate = new Date()

    // Create 3 test chats
    for (let i = 1; i <= 5; i++) {
        const chatId = crypto.randomUUID()
        const messages: Array<Message> = []
        const chatCreated = new Date(baseDate.getTime() - i * 3600000) // 1 hour apart

        // Create 2-4 test messages per chat
        for (let j = 0; j < Math.max(2, i); j++) {
            // Vary message count
            messages.push({
                content: `Test message ${j + 1} in chat ${i} - user`,
                role: "user",
                timestamp: new Date(chatCreated.getTime() + j * 60000), // 1 minute apart
            })

            messages.push({
                content: `Test response ${j + 1} in chat ${i} - assistant`,
                role: "assistant",
                timestamp: new Date(
                    chatCreated.getTime() + (j * 60000 + 30000)
                ), // 30s after user
            })
        }

        testChats.push({
            id: chatId,
            title: `Test Chat ${i} - ${messages[0].content.substring(
                0,
                12
            )}...`,
            messages,
            createdAt: chatCreated,
            updatedAt: messages[messages.length - 1].timestamp,
            model_name: "llama3.2:latest",
            system_prompt: "This is a system prompt for chat " + i,
        })
    }

    if (reset) {
        chats.set(testChats)
    } else {
        chats.update(($chats) => [...$chats, ...testChats])
    }

    activeChatId.set(testChats[0].id)
}
