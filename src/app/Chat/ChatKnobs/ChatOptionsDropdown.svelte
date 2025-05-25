<script lang="ts">
    import { Gears } from "carbon-icons-svelte"
    import {
        chatGetAllContents,
        chatInProgress,
    } from "../../../lib/chatSession/chatActions"
    import { currentChat } from "../../../lib/chatSession/chatSession"
    import ContextMenu from "../../UI/ContextMenu.svelte"
    import IconButton from "../../UI/IconButton.svelte"

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

    const menuItems = [
        { name: "Copy chat to clipboard", action: copyChatToClipboard },
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
