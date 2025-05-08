<script lang="ts">
    import { onDestroy, onMount } from "svelte"
    import {
        chatAddPastedMedia,
        ChatMediaType,
    } from "../../../lib/chatSession/chatAttachments"
    import { currentChat } from "../../../lib/chatSession/chatSession"

    async function handlePaste(ev: ClipboardEvent) {
        if (ev.clipboardData?.files && ev.clipboardData?.files.length > 0) {
            for (const clipboardItem of ev.clipboardData?.files) {
                if (clipboardItem.type.startsWith("image/")) {
                    ev.preventDefault()

                    chatAddPastedMedia(
                        $currentChat?.id,
                        new Blob([clipboardItem], { type: clipboardItem.type }),
                        ChatMediaType.IMAGE,
                    )
                }
            }
        }
    }

    onMount(() => {
        document.addEventListener("paste", handlePaste)
    })

    onDestroy(() => {
        document.removeEventListener("paste", handlePaste)
    })
</script>

<style lang="scss">
</style>
