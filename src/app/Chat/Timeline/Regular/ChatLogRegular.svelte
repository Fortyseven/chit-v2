<script lang="ts">
    import { appState } from "../../../../lib/appState/appState"
    import {
        chatGetStreamingPending,
        chatInProgressWithId,
    } from "../../../../lib/chatSession/chatActions"
    import { ChatMediaType } from "../../../../lib/chatSession/chatAttachments"
    import { chats, currentChat } from "../../../../lib/chatSession/chatSession"
    import { memoizeBlobUrl } from "../../../../lib/memoizeBlob"
    import ChatLogRegular_Assistant from "./ChatLogRegular_Assistant.svelte"
    import ChatLogRegular_ReferencesInUse from "./ChatLogRegular_ReferencesInUse.svelte"
    import ChatLogRegular_User from "./ChatLogRegular_User.svelte"
    import FloatingImage from "./FloatingImage.svelte"

    function isObjectEmpty(obj: any) {
        return Object.keys(obj).length === 0
    }

    // Track floating images
    let floatingImages: any[] = []

    function openFloatingImage(mediaData: Blob) {
        const imageUrl = memoizeBlobUrl(mediaData)
        floatingImages = [...floatingImages, imageUrl]
    }

    function closeFloatingImage(imageUrl: string) {
        floatingImages = floatingImages.filter((url) => url !== imageUrl)
    }

    // Update chat message
    function updateChatMessage(index: number, message: any) {
        // Update the chat with the new message
        const chatId = $appState.activeChatId

        if (chatId) {
            chats.update((currentChats) => {
                return currentChats.map((chat) => {
                    if (chat.id === chatId) {
                        // Create a new chat object with updated messages
                        return {
                            ...chat,
                            messages: chat.messages.map((msg, i) => {
                                if (i === index) {
                                    // Create a new message object with the updated content
                                    return { ...msg, content: message }
                                }
                                return msg
                            }),
                        }
                    }
                    return chat
                })
            })
        }
    }
    function isMostRecentUserMessage(index: number) {
        const messages = $currentChat?.messages || []
        if (messages.length === 0) return false

        // Check if the current message is the most recent user message
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === "user") {
                return i === index
            }
        }
        return false
    }
</script>

<div class="wrapper" id="ChatLogRegular">
    {#if $appState.activeChatId && $currentChat?.messages}
        {#each $currentChat.messages as message, index}
            {#key message}
                {#if message.role === "user"}
                    {#if message.media && message.media.length > 0}
                        <div class="media-container">
                            {#each message.media as media}
                                {#if media.type === ChatMediaType.IMAGE}
                                    <div class="media-attachment">
                                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                                        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                                        <img
                                            src={memoizeBlobUrl(
                                                media?.data as Blob,
                                            )}
                                            alt="Media Attachment"
                                            class="media-attachment-image"
                                            on:click={() =>
                                                openFloatingImage(
                                                    media?.data as Blob,
                                                )}
                                        />
                                    </div>
                                {/if}
                                {#if media.type === ChatMediaType.TEXT}
                                    <div class="media-attachment">
                                        <ChatLogRegular_User
                                            line={media?.data as string}
                                            isAttachment
                                        />
                                    </div>
                                {/if}
                            {/each}
                        </div>
                    {/if}

                    {#if message.content}
                        <ChatLogRegular_User line={message.content as string} />
                    {/if}

                    {#if isMostRecentUserMessage(index)}
                        <ChatLogRegular_ReferencesInUse />
                    {/if}
                {:else if message.role === "user" && !message.content}
                    <!-- cont'd -->
                {:else}
                    <ChatLogRegular_Assistant
                        line={message.content}
                        {index}
                        onUpdatedContent={updateChatMessage}
                    />
                {/if}
            {/key}
        {/each}

        {#key $currentChat}
            {#if chatInProgressWithId($appState.activeChatId)}
                <ChatLogRegular_Assistant
                    line={chatGetStreamingPending()}
                    inprogress
                ></ChatLogRegular_Assistant>
            {/if}
        {/key}
    {/if}
</div>

<!-- Floating images container -->
{#each floatingImages as imageUrl}
    <FloatingImage
        src={imageUrl}
        alt="Floating Media"
        on:close={() => closeFloatingImage(imageUrl)}
    />
{/each}

<style lang="scss">
    #ChatLogRegular {
        width: stretch;
        flex-direction: column;
        overflow-y: auto;
        overflow-x: scroll;
        max-width: var(--timeline-max-width);
        margin-inline: auto;
        font-size: 1.25em;
        margin-block: 6rem 12rem;
        padding-inline: 1em;

        .media-container {
            display: flex;
            gap: 1em;
            flex-wrap: wrap;
            .media-attachment {
                width: 100%;
                margin-block-start: 1em;
                margin-block-end: 0.5em;
                img {
                    max-width: 512px;
                    max-height: 512px;
                    outline: 4px solid var(--color-background-lighter);
                    border-radius: var(--border-radius-standard);
                    box-shadow: 0 0 40px rgba(0, 0, 0, 1);
                    cursor: pointer;
                    transition: transform 0.2s;

                    &:hover {
                        transform: scale(1.02);
                    }
                }
            }
        }
    }
</style>
