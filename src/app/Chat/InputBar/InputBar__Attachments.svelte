<script lang="ts">
    import { derived } from "svelte/store"
    import {
        chatAddPastedMedia,
        chatClearPastedMedia,
        ChatMediaType,
    } from "../../../lib/chatSession/chatAttachments"
    import { currentChat } from "../../../lib/chatSession/chatSession"
    import { memoizeBlobUrl } from "../../../lib/memoizeBlob"
    import { loadFile } from "../../../lib/utils"
    import Pill from "../../UI/Pill/Pill.svelte"

    export let inputBoxEl: HTMLTextAreaElement | undefined = undefined

    /* ------------------------------------------------------ */
    async function onClickAddContext() {
        let loadedFile = await loadFile([
            ".jpg",
            ".png",
            ".webp",
            ".gif",
            ".txt",
            ".pdf",
            ".md",
            ".py",
            ".js",
            ".html",
            ".htm",
            ".css",
            ".json",
            ".csv",
            ".xml",
            ".yml",
            ".yaml",
            ".toml",
        ])

        if (loadedFile) {
            const type = loadedFile.file.type
            const file = loadedFile.file
            let result = loadedFile.result

            if (file && type) {
                if (type.startsWith("text/") && inputBoxEl) {
                    inputBoxEl.value += result
                } else if (type.startsWith("image/")) {
                    console.log("UPLOADED TYPE", type)
                    // const blob =
                    chatAddPastedMedia(
                        $currentChat?.id,
                        new Blob([result], { type }),
                        ChatMediaType.IMAGE,
                    )
                } else {
                    throw `Unsupported file type:${type}`
                }
            } else {
                throw new Error("File or type is undefined")
            }
        }
    }
</script>

<button class="small" onclick={onClickAddContext}>Add Context +</button>

{#if $currentChat?.pastedMedia}
    {#each $currentChat?.pastedMedia as media, index}
        {#key index}
            {#if media.type == ChatMediaType.IMAGE}
                <Pill
                    text="Image"
                    dismissible
                    enableTooltip
                    color="var(--color-accent-complement)"
                    on:dismiss={() => {
                        chatClearPastedMedia($currentChat?.id, media.id)
                    }}
                >
                    <!-- svelte-ignore a11y_missing_attribute -->
                    {#if media.data instanceof Blob}
                        <img
                            src={memoizeBlobUrl(media.data)}
                            class="btn-image-attach"
                        />
                    {/if}
                </Pill>
            {:else if media.type === ChatMediaType.TEXT}
                <Pill
                    text="Text"
                    dismissible
                    color="var(--color-accent-complement)"
                    on:dismiss={() => {
                        chatClearPastedMedia($currentChat?.id, media.id)
                    }}
                >
                    {media}
                </Pill>
            {:else}
                ????
            {/if}
        {/key}
    {/each}
{/if}

<!-- {#if $currentChat?.pastedMedia && $currentChat?.pastedMedia instanceof File}
    <Pill
        text="File"
        dismissible={$currentChat?.pastedMedia instanceof File}
        color="var(--color-accent-complement)"
        on:dismiss={() => {
            chatClearPastedMedia()
        }}
    >
        {$currentChat?.pastedMedia.name}
    </Pill>
{/if}

{#if $currentChat?.pastedMedia && $currentChat?.pastedMedia instanceof Blob}
    <Pill
        text="Image"
        dismissible={$currentChat?.pastedMedia &&
            $currentChat?.pastedMedia instanceof Blob}
        color="var(--color-accent-complement)"
        on:dismiss={() => {
            chatClearPastedMedia()
        }}
    >

        <img
            src={$currentChat?.pastedMedia
                ? URL.createObjectURL($currentChat?.pastedMedia)
                : ""}
            class="btn-image-attach"
        />
    </Pill>
{/if} -->

<style lang="scss">
    .btn-image-attach {
        position: relative;
        right: 0px;
        top: 0;
        max-width: 256px;
        max-height: 256px;
    }
</style>
