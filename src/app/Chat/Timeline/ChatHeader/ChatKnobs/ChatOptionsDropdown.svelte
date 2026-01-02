<script lang="ts">
    import ContextMenu from "$app/UI/ContextMenu.svelte"
    import IconButton from "$app/UI/IconButton.svelte"
    import {
        chatGenerateSummary,
        chatGetAllContents,
        chatInProgress,
        chatSetTitle,
    } from "$lib/chatSession/chatActions"
    import { currentChat } from "$lib/chatSession/chatSession"
    import { chatGenerateTitle } from "$lib/chatSession/chatTitler"
    import { openCompactConversationDialog } from "$lib/chatSession/compactConversationDialog"
    import { Gears } from "carbon-icons-svelte"

    //TODO: convert this to a general component

    let isOpen = false
    let openAt = {
        x: 0,
        y: -100,
    }

    let configEl: HTMLDivElement

    function copyChatToClipboard() {
        const chatContents = chatGetAllContents()

        if (chatContents) {
            navigator.clipboard.writeText(chatContents)
        }
        isOpen = false
    }

    function saveChatToFile() {
        const chatContents = chatGetAllContents()

        if (chatContents) {
            // markdown
            const blob = new Blob([chatContents], { type: "text/markdown" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            const title = $currentChat?.title ? $currentChat.title : "chat"
            a.download = `${title}.md`
            a.click()
            URL.revokeObjectURL(url)
        }

        isOpen = false
    }

    async function regenerateTitle() {
        if (!$currentChat) {
            console.warn("No current chat to regenerate title for.")
            return
        }

        try {
            $chatInProgress = true
            chatSetTitle($currentChat.id, "...")
            await chatGenerateTitle($currentChat.id)
        } catch (error) {
            console.error("Error regenerating title:", error)
        } finally {
            isOpen = false
            $chatInProgress = false
        }
    }

    async function compactConversation(chatId: string | undefined) {
        if (!chatId) {
            console.warn("No chat ID provided for compaction.")
            return
        }

        isOpen = false

        try {
            $chatInProgress = true
            const summary = await chatGenerateSummary(chatId)
            openCompactConversationDialog(chatId, summary)
        } catch (error) {
            console.error("Error generating conversation summary:", error)
        } finally {
            $chatInProgress = false
        }
    }

    const menuItems = [
        { name: "Copy chat to clipboard", action: copyChatToClipboard },
        { name: "-" }, // Separator
        {
            name: "Regenerate title",
            action: regenerateTitle,
        },
        {
            name: "Compact conversation",
            action: () => {
                compactConversation($currentChat?.id)
            },
        },
        { name: "-" }, // Separator
        { name: "Save chat to file", action: saveChatToFile },
    ]
</script>

<div class="chat-options" bind:this={configEl}>
    <IconButton
        title="Chat Options"
        onClick={(btnEl, mEvent) => {
            if (configEl) {
                isOpen = !isOpen

                mEvent.stopPropagation()
                mEvent.preventDefault()
            }
        }}
        iconComponent={Gears}
        secondary
        disabled={$chatInProgress}
        className="btn-preset"
        roundCorner="ne"
    />
    <ContextMenu
        bind:open={isOpen}
        items={menuItems}
        position={openAt}
        onClose={() => {
            isOpen = false
        }}
    />
</div>

<style lang="scss">
    .chat-options {
        position: relative;
    }
</style>
