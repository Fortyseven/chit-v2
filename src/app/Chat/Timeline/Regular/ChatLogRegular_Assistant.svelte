<script lang="ts">
    import {
        chatChopLatest,
        chatRunInference,
    } from "$lib/chatSession/chatActions"
    import { currentChat } from "$lib/chatSession/chatSession"
    import toast from "$lib/toast"
    import {
        ttsSpeak,
        ttsSpeaking,
        ttsStop,
        voiceSettings,
    } from "$lib/voice/tts"
    import { Copy, Renew, Save } from "carbon-icons-svelte"
    // @ts-ignore
    import MarkdownEditor from "../../../components/MarkdownEditor.svelte"

    export let content = ""
    export let inprogress = false
    export let isThoughts = false
    export let index: number
    export let onUpdatedContent = (_index: number, _content: string) => {}
    export let isLatest = false

    // Context menu state
    let openEditor = false
    let renderHtml: boolean = false

    function saveAsFile() {
        console.log("content", content)
        const blob = new Blob([content], { type: `text/markdown` })
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
        navigator.clipboard.writeText(content)
        toast("Copied response to clipboard")
    }

    async function regenerateResponse() {
        // Remove the last assistant response and generate a new one
        chatChopLatest()
        await chatRunInference()
    }

    // TTS controls
    function speak() {
        // content can be string or object with content
        const text = typeof content === "string" ? content : content.content
        if (!text) return
        ttsSpeak(text)
    }
    function stopSpeak() {
        ttsStop()
    }
</script>

{#if isThoughts}
    <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
    <details
        open
        class="response markdown bot thoughts"
        role="button"
        tabindex="0"
        class:inprogress
        data-testid="ChatLogRegular_Assistant"
    >
        <summary>&lt;THINK&gt;</summary>
        <!-- <div class="message-controls">
            <button class="dropdown" on:click={toggleContextMenu}>⋮</button>
        </div> -->
        <MarkdownEditor
            {content}
            {index}
            editorOpen={openEditor}
            {onUpdatedContent}
        />
    </details>
{:else}
    <div
        class="response markdown bot"
        class:html={renderHtml}
        role="button"
        tabindex="0"
        class:inprogress
        data-testid="ChatLogRegular_Assistant"
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
            {content}
            {index}
            editorOpen={openEditor}
            {onUpdatedContent}
            {renderHtml}
        />
    </div>
    <div class="mini-toolbar">
        <div class="left"></div>
        <div class="right">
            <button
                on:click={() => (renderHtml = !renderHtml)}
                class:on={renderHtml}>HTML</button
            >
            <button on:click={() => (openEditor = true)}>Edit</button>
            <div class="divider" aria-hidden="true">|</div>
            <button on:click={saveAsFile}><Save /></button>
            <button on:click={regenerateResponse}><Renew /></button>
            <button on:click={() => copyToClipboard()}><Copy /></button>
        </div>
    </div>
{/if}

<style lang="scss">
    details.response {
        border: 1px solid red;
        margin-bottom: 1em;
        summary {
            cursor: pointer;
            opacity: 0.5;
            text-transform: uppercase;
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
        font-size: 1.2em;
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
            color: var(--color-accent-complement-lighter);
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
