<script lang="ts">
    import {
        chatChopLatest,
        chatRunInference,
    } from "$lib/chatSession/chatActions"
    import {
        ChatMediaType,
        getMediaBlob,
    } from "$lib/chatSession/chatAttachments"
    import { currentChat } from "$lib/chatSession/chatSession"
    import { memoizeBlobUrl } from "$lib/memoizeBlob"
    import toast from "$lib/toast"
    import {
        ttsSpeak,
        ttsSpeaking,
        ttsStop,
        voiceSettings,
    } from "$lib/voice/tts"
    import {
        Code,
        Content_copy,
        Edit,
        Replay,
        Save_alt,
    } from "svelte-google-materialdesign-icons"
    import MarkdownEditor from "../../../components/MarkdownEditor.svelte"
    import { createThinkingBlockStore } from "./thinkingBlockState"

    type MessageContent = string | { content: string }

    export let content: MessageContent = ""
    export let inprogress = false
    export let isThoughts = false
    export let index: number
    export let onUpdatedContent = (_index: number, _content: string) => {}
    export let isLatest = false

    // Context menu state
    let openEditor = false
    let renderHtml: boolean = false
    let messageEl: HTMLElement | null = null

    $: chatId = $currentChat?.id ?? "streaming"
    $: stateKey = `${chatId}-${inprogress ? "streaming" : index}`

    // Create a writable store for this specific thinking block
    $: thinkingOpenStore = createThinkingBlockStore(stateKey)

    $: messageText = typeof content === "string" ? content : content.content

    // Source image URL for bbox rendering
    let sourceImageUrl: string | null = null

    // Resolve source image URL from the most recent user message with an image
    async function resolveSourceImage(msgIndex: number): Promise<string | null> {
        if (inprogress) return null // No source image during streaming
        const messages = $currentChat?.messages || []
        // Search backwards from current message for the most recent user message with an image
        for (let i = msgIndex - 1; i >= 0; i--) {
            const msg = messages[i]
            if (msg.role === "user" && msg.media?.some((m) => m.type === ChatMediaType.IMAGE)) {
                // Find the first image media item
                const imageMedia = msg.media.find((m) => m.type === ChatMediaType.IMAGE)
                if (imageMedia) {
                    try {
                        // Handle string data directly
                        if (typeof imageMedia.data === "string" && imageMedia.data) {
                            return imageMedia.data
                        }
                        // Handle Blob data
                        if (imageMedia.data instanceof Blob) {
                            return memoizeBlobUrl(imageMedia.data) || null
                        }
                        // Handle IndexedDB-stored data (async)
                        if (imageMedia.isStored && imageMedia.blobId) {
                            const blob = await getMediaBlob(imageMedia)
                            if (blob instanceof Blob) {
                                return memoizeBlobUrl(blob) || null
                            }
                        }
                    } catch (err) {
                        console.warn("Failed to resolve source image:", err)
                    }
                }
            }
        }
        return null
    }

    // Update source image when index changes
    $: if (!inprogress) {
        resolveSourceImage(index).then((url) => {
            sourceImageUrl = url
        })
    }

    function handleThinkToggle() {
        thinkingOpenStore.set(!$thinkingOpenStore)
    }

    function getMessageText() {
        return typeof content === "string" ? content : content.content
    }

    function saveAsFile() {
        console.log("content", content)
        const text = getMessageText()
        const blob = new Blob([text], { type: `text/markdown` })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        const title = $currentChat?.title ? $currentChat.title : "response"
        a.download = `${title}-fragment-${index}.md`
        a.click()
        URL.revokeObjectURL(url)
    }

    function copyToClipboard() {
        //navigator.clipboard.writeText(line.content)
        navigator.clipboard.writeText(getMessageText())
        toast("Copied response to clipboard")
    }

    async function regenerateResponse() {
        // Remove the last assistant response and generate a new one
        chatChopLatest()
        await chatRunInference()
    }

    function getSelectedTextWithin(el: HTMLElement | null) {
        if (!el || typeof window === "undefined") return ""
        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) return ""
        const { anchorNode, focusNode } = selection
        if (!anchorNode || !focusNode) return ""
        const selected = selection.toString().trim()
        if (!selected) return ""
        const withinElement = el.contains(anchorNode) && el.contains(focusNode)
        return withinElement ? selected : ""
    }

    // TTS controls
    function speak() {
        // content can be string or object with content
        const fullText = getMessageText()
        const selectedText = getSelectedTextWithin(messageEl)
        const text = selectedText || fullText
        if (!text) return
        ttsSpeak(text)
    }
    function stopSpeak() {
        ttsStop()
    }

    function handleKeydown(e: KeyboardEvent) {
        if ((e.ctrlKey || e.metaKey) && e.key === "p") {
            e.preventDefault()
            if ($ttsSpeaking) {
                stopSpeak()
            } else {
                speak()
            }
        }
    }
</script>

{#if isThoughts}
    <div
        class="response markdown bot thoughts"
        class:inprogress
        data-testid="ChatLogRegular_Assistant"
    >
        <div
            class="think-summary"
            role="button"
            tabindex="0"
            on:click={handleThinkToggle}
            on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleThinkToggle()
            }}
        >
            <span class="think-arrow" class:open={$thinkingOpenStore}>▶</span>
            Thinking...
            {#if !$thinkingOpenStore && inprogress}
                <span class="thinking-indicator">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </span>
            {/if}
        </div>
        {#if $thinkingOpenStore}
            <MarkdownEditor
                content={messageText}
                {index}
                bind:editorOpen={openEditor}
                {onUpdatedContent}
                sourceImage={sourceImageUrl}
            />
        {/if}
    </div>
{:else}
    <div
        class="response markdown bot"
        class:html={renderHtml}
        role="button"
        tabindex="0"
        class:inprogress
        data-testid="ChatLogRegular_Assistant"
        bind:this={messageEl}
        on:keydown={handleKeydown}
    >
        <div class="message-controls">
            {#if isLatest && $voiceSettings.enabled}
                {#if $ttsSpeaking}
                    <button
                        title="Stop speaking"
                        class="tts"
                        on:click={stopSpeak}>⏹</button
                    >
                {:else}
                    <button title="Speak" class="tts" on:click={speak}
                        >🔊</button
                    >
                {/if}
            {/if}
        </div>
        <MarkdownEditor
            content={messageText}
            {index}
            bind:editorOpen={openEditor}
            {onUpdatedContent}
            {renderHtml}
            sourceImage={sourceImageUrl}
        />
    </div>
    <div class="mini-toolbar">
        <div class="left"></div>
        <div class="right">
            <button
                on:click={() => (renderHtml = !renderHtml)}
                class:on={renderHtml}
                title="Toggle HTML view"><Code size="16" /></button
            >
            <button on:click={() => (openEditor = true)} title="Edit"
                ><Edit size="16" /></button
            >
            <div class="divider" aria-hidden="true">|</div>
            <button on:click={saveAsFile} title="Save as file"
                ><Save_alt size="16" /></button
            >
            <button on:click={regenerateResponse} title="Regenerate response"
                ><Replay size="16" /></button
            >
            <button on:click={() => copyToClipboard()} title="Copy to clipboard"
                ><Content_copy size="16" /></button
            >
        </div>
    </div>
{/if}

<style lang="scss">
    .thoughts {
        border: 1px solid red;
        margin-bottom: 1em;

        .think-summary {
            cursor: pointer;
            opacity: 0.5;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            gap: 0.5em;
            user-select: none;
            margin-bottom: 1.5em;
        }

        .think-arrow {
            display: inline-block;
            font-size: 0.7em;
            transition: transform 0.15s ease;
            &.open {
                transform: rotate(90deg);
            }
        }
    }

    .thinking-indicator {
        display: inline-flex;
        align-items: center;
        gap: 0.25em;
        margin-left: 0.5em;

        .dot {
            width: 0.4em;
            height: 0.4em;
            background-color: var(--color-accent-complement);
            border-radius: 50%;
            animation: thinking-pulse 1.4s ease-in-out infinite;

            &:nth-child(1) {
                animation-delay: 0s;
            }
            &:nth-child(2) {
                animation-delay: 0.2s;
            }
            &:nth-child(3) {
                animation-delay: 0.4s;
            }
        }
    }

    @keyframes thinking-pulse {
        0%,
        60%,
        100% {
            opacity: 0.3;
            transform: scale(0.8);
        }
        30% {
            opacity: 1;
            transform: scale(1.2);
        }
    }

    .response {
        width: auto;
        font-family: var(--font-timeline, monospace);
        line-height: 1.2;
        border-radius: var(--border-radius-standard);
        box-shadow: 0 0.25em 0.25em 0 #000;
        text-align: start;
        padding-inline: 1em;
        font-size: 1.1em;
        // background-color: var(--color-background-darker);
        background-color: #1111118a;
        color: var(--color-text-assistant);
        border-bottom: 1px solid #ffffff30;
        border-top: 1px solid #fff2;
        margin: auto;
        position: relative;
        overflow-y: clip;
        overflow-x: auto;

        &:first-of-type {
            margin-top: 1em;
        }

        &.markdown.html {
            background-color: #fff;
            color: #000;

            .rendered-content table > tbody > tr > td {
                .markdown-editor .rendered-content {
                    font-family:
                        system-ui,
                        -apple-system,
                        BlinkMacSystemFont,
                        "Segoe UI",
                        Roboto,
                        Oxygen,
                        Ubuntu,
                        Cantarell,
                        "Open Sans",
                        "Helvetica Neue",
                        sans-serif;
                }
            }
        }

        .message-controls {
            position: absolute;
            top: 0.5em;
            right: 0.5em;
            opacity: 0.25;
            transition: opacity 0.2s ease-in-out;
            z-index: 10;

            &:hover {
                opacity: 1;
            }

            button.dropdown {
                background: transparent;
                color: var(--color-accent);
                font-size: 1.25em;
                font-weight: bold;
                padding: 0.2em 0.5em;
                border-radius: var(--border-radius-standard);
                cursor: pointer;

                &:hover {
                    background-color: var(--color-background-lighter);
                }
            }

            button.tts {
                background: transparent;
                color: var(--color-accent-complement);
                font-size: 1.1em;
                font-weight: bold;
                padding: 0.2em 0.5em;
                border-radius: var(--border-radius-standard);
                cursor: pointer;
                margin-left: 0.25em;
                &:hover {
                    background-color: var(--color-background-lighter);
                }
            }
        }

        pre {
            overflow: scroll;
        }

        &.thoughts {
            background-color: #2222228a;
            font-size: 0.75em;
            opacity: 0.75;
            color: var(--color-accent-complement-lightest);
            background: unset;
            border: unset;
            box-shadow: unset;
            line-height: 0.95;
            font-family: monospace;
        }
    }
    .mini-toolbar {
        display: flex;
        padding-block: 1em;
        justify-content: right;
        .left,
        .right {
            flex: 1 1 auto;
            gap: 0.5rem;
            display: flex;
        }
        .left {
            justify-content: left;
        }
        .right {
            justify-content: right;
        }

        .divider {
            color: var(--color-accent-darker);
        }

        button {
            flex: 0 0 auto;
            font-size: 0.5em;
            height: 1.9rem;
            background-color: transparent;
            color: var(--color-accent-lighter);
            border-radius: 5px;
            border: 2px solid var(--color-accent-darker);
            padding-inline: 0.5em;
            transition: all 0.2s;
            &:hover {
                color: white;
                border-color: white;
            }
            &.on {
                background-color: var(--color-accent);
                border: none;
                color: black;
            }
        }
    }
</style>
