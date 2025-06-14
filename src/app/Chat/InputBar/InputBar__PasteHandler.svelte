<script lang="ts">
    import { onDestroy, onMount } from "svelte"
    import { appState } from "../../../lib/appState/appState"
    import {
        chatAddPastedMedia,
        ChatMediaType,
        MAX_DIMENSION,
        resizeImage,
    } from "../../../lib/chatSession/chatAttachments"
    import { currentChat } from "../../../lib/chatSession/chatSession"

    async function handlePaste(ev: ClipboardEvent) {
        if (ev.clipboardData?.files && ev.clipboardData?.files.length > 0) {
            for (const clipboardItem of ev.clipboardData?.files) {
                if (clipboardItem.type.startsWith("image/")) {
                    ev.preventDefault()

                    // if image size in either dimension is larger than MAX_DIMENSION,
                    // resize it before adding to chat
                    if (
                        clipboardItem.size > 0 &&
                        $appState.resizeImages &&
                        (clipboardItem.size > MAX_DIMENSION ||
                            clipboardItem.size > MAX_DIMENSION)
                    ) {
                        resizeImage(clipboardItem, MAX_DIMENSION).then(
                            (resizedBlob) => {
                                chatAddPastedMedia(
                                    $currentChat?.id,
                                    resizedBlob,
                                    ChatMediaType.IMAGE,
                                )
                            },
                        )
                    } else {
                        chatAddPastedMedia(
                            $currentChat?.id,
                            new Blob([clipboardItem], {
                                type: clipboardItem.type,
                            }),
                            ChatMediaType.IMAGE,
                        )
                    }
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
