<script lang="ts">
    import { appState } from "$lib/appState/appState"
    import {
        chatGetStreamingPending,
        chatGetStreamingPendingThoughts,
        chatInProgressWithId,
    } from "$lib/chatSession/chatActions"
    import {
        ChatMediaType,
        getMediaBlob,
    } from "$lib/chatSession/chatAttachments"
    import { chats, currentChat } from "$lib/chatSession/chatSession"
    import AsyncMediaImage from "../../../components/AsyncMediaImage.svelte"
    import ChatLogRegular_Assistant from "./ChatLogRegular_Assistant.svelte"
    import ChatLogRegular_ReferencesInUse from "./ChatLogRegular_ReferencesInUse.svelte"
    import ChatLogRegular_User from "./ChatLogRegular_User.svelte"

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

<div class="wrapper" data-testid="ChatLogRegular">
    {#if $appState.activeChatId && $currentChat?.messages}
        {#each $currentChat.messages as message, index (message.id || `msg-${index}`)}
            {#if message.role === "user"}
                {#if message.media && message.media.length > 0}
                    <div class="media-container">
                        {#each message.media as media}
                            {#if media.type === ChatMediaType.IMAGE}
                                <div class="media-attachment">
                                    <AsyncMediaImage
                                        {media}
                                        cssClass="media-attachment-image"
                                        altText="Media Attachment"
                                        maxWidth={256}
                                        maxHeight={256}
                                    />
                                </div>
                            {/if}
                            {#if media.type === ChatMediaType.TEXT}
                                <div class="media-attachment">
                                    {#await getMediaBlob(media)}
                                        <ChatLogRegular_User
                                            line="Loading..."
                                            isAttachment
                                        />
                                    {:then textData}
                                        <ChatLogRegular_User
                                            line={typeof textData === "string"
                                                ? textData
                                                : "Invalid text data"}
                                            isAttachment
                                        />
                                    {:catch error}
                                        <ChatLogRegular_User
                                            line="Failed to load text"
                                            isAttachment
                                        />
                                    {/await}
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
                {#if message.thoughts}
                    <ChatLogRegular_Assistant
                        content={message.thoughts}
                        isThoughts
                        {index}
                        isLatest={index === $currentChat.messages.length - 1}
                        onUpdatedContent={updateChatMessage}
                    />
                {/if}
                <ChatLogRegular_Assistant
                    content={message.content}
                    {index}
                    isLatest={index === $currentChat.messages.length - 1}
                    onUpdatedContent={updateChatMessage}
                />
            {/if}
        {/each}

        {#key $currentChat}
            {#if chatInProgressWithId($appState.activeChatId)}
                {#if $currentChat.hasThoughts}
                    <ChatLogRegular_Assistant
                        content={chatGetStreamingPendingThoughts()}
                        isThoughts
                        inprogress
                        isLatest={false}
                    />
                {/if}
                <ChatLogRegular_Assistant
                    content={chatGetStreamingPending()}
                    inprogress
                    isLatest={false}
                />
            {/if}
        {/key}
    {/if}
</div>

<style lang="scss">
    .wrapper {
        width: stretch;
        flex-direction: column;
        overflow-y: auto;
        overflow-x: auto;
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
