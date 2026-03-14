<script lang="ts">
    import { chatSetTtsSettings } from "$lib/chatSession/chatActions"
    import { ChatMediaType } from "$lib/chatSession/chatAttachments"
    import {
        AppMode,
        currentChat,
        currentChatMode,
    } from "$lib/chatSession/chatSession"
    import {
        ttsListVoices,
        ttsSpeak,
        ttsSpeaking,
        ttsStop,
        voiceSettings,
    } from "$lib/voice/tts"
    import { onMount } from "svelte"
    import AsyncMediaImage from "../../components/AsyncMediaImage.svelte"

    $: currentMode = $currentChatMode

    // Get all image attachments from the current chat session
    $: allImageMedia =
        $currentChat?.messages
            ?.flatMap((message) => message.media || [])
            ?.filter((media) => media.type === ChatMediaType.IMAGE) || []

    // Effective per-chat TTS settings, falling back to global defaults
    $: chatTTS = $currentChat?.ttsSettings
    $: effectiveVoice =
        chatTTS?.voice !== undefined
            ? (chatTTS.voice ?? "")
            : ($voiceSettings.preferredVoice ?? "")
    $: effectiveRate = chatTTS?.rate ?? $voiceSettings.rate
    $: effectivePitch = chatTTS?.pitch ?? $voiceSettings.pitch

    let availableVoices: { id: string; name: string; lang?: string }[] = []
    let speechOpen = false

    onMount(async () => {
        if ($voiceSettings.enabled) {
            try {
                availableVoices = await ttsListVoices()
            } catch (e) {
                console.warn("RPModePanel: failed to load voices", e)
            }
        }
    })

    function setVoice(e: Event) {
        const val = (e.target as HTMLSelectElement).value
        chatSetTtsSettings("", { voice: val || null })
    }

    function setRate(e: Event) {
        chatSetTtsSettings("", {
            rate: Number((e.target as HTMLInputElement).value),
        })
    }

    function setPitch(e: Event) {
        chatSetTtsSettings("", {
            pitch: Number((e.target as HTMLInputElement).value),
        })
    }

    function testVoice() {
        if ($ttsSpeaking) {
            ttsStop()
        } else {
            ttsSpeak("This is a test of your text to speech settings.")
        }
    }
</script>

{#if currentMode === AppMode.RP}
    <div class="rp-mode-panel">
        <div class="mode-badge">
            <span class="mode-icon">🎭</span>
            <span class="mode-text">RP Mode</span>
        </div>
        {#if $voiceSettings.enabled}
            <div class="speech-accordion">
                <button
                    class="accordion-header"
                    class:open={speechOpen}
                    on:click={() => (speechOpen = !speechOpen)}
                >
                    <span>🔊 Speech</span>
                    <span class="chevron">{speechOpen ? "▲" : "▼"}</span>
                </button>
                {#if speechOpen}
                    <div class="accordion-body">
                        {#if availableVoices.length > 0}
                            <label class="control-row">
                                <span>Voice</span>
                                <select
                                    value={effectiveVoice}
                                    on:change={setVoice}
                                >
                                    <option value="">(Default)</option>
                                    {#each availableVoices as v}
                                        <option value={v.id}
                                            >{v.name}{v.lang
                                                ? ` (${v.lang})`
                                                : ""}</option
                                        >
                                    {/each}
                                </select>
                            </label>
                        {/if}
                        <label class="control-row">
                            <span
                                >Rate&nbsp;<small
                                    >{effectiveRate.toFixed(2)}</small
                                ></span
                            >
                            <input
                                type="range"
                                min="0.5"
                                max="2"
                                step="0.05"
                                value={effectiveRate}
                                on:input={setRate}
                            />
                        </label>
                        <label class="control-row">
                            <span
                                >Pitch&nbsp;<small
                                    >{effectivePitch.toFixed(2)}</small
                                ></span
                            >
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.05"
                                value={effectivePitch}
                                on:input={setPitch}
                            />
                        </label>
                        <button class="test-btn" on:click={testVoice}>
                            {$ttsSpeaking ? "■ Stop" : "▶ Test"}
                        </button>
                    </div>
                {/if}
            </div>
        {/if}
        {#if allImageMedia.length > 0}
            <div class="media-thumbnails">
                <div class="media-header">Media</div>
                <div class="media-grid">
                    {#each allImageMedia as media (media.id)}
                        <AsyncMediaImage
                            {media}
                            cssClass="media-thumb"
                            altText="Chat Media"
                            maxWidth={"100%"}
                            maxHeight={"100%"}
                        />
                    {/each}
                </div>
            </div>
        {/if}
    </div>
{/if}

<style lang="scss">
    .rp-mode-panel {
        transition: all 0.2s ease;
        color: var(--color-accent-complement-lighter);
    }

    .speech-accordion {
        margin-top: 1em;

        .accordion-header {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--color-background-darkest);
            border: 1px solid #444;
            border-radius: var(--border-radius-standard);
            padding: 0.35em 0.6em;
            font-size: 0.85em;
            font-weight: 600;
            color: var(--color-accent-complement-lighter);
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 0.04em;

            &:hover {
                border-color: var(--color-accent);
            }

            &.open {
                border-bottom-left-radius: 0;
                border-bottom-right-radius: 0;
                border-bottom-color: transparent;
            }

            .chevron {
                font-size: 0.7em;
                opacity: 0.7;
            }
        }

        .accordion-body {
            border: 1px solid #444;
            border-top: none;
            border-bottom-left-radius: var(--border-radius-standard);
            border-bottom-right-radius: var(--border-radius-standard);
            padding: 0.6em 0.6em 0.5em;
            display: flex;
            flex-direction: column;
            gap: 0.5em;
        }

        .control-row {
            display: flex;
            flex-direction: column;
            gap: 0.2em;
            font-size: 0.8em;
            color: var(--color-accent-complement-lighter);

            span {
                display: flex;
                align-items: baseline;
                gap: 0.3em;
                text-transform: uppercase;
                font-weight: 600;
                letter-spacing: 0.04em;
                opacity: 0.9;
            }

            small {
                font-weight: 400;
                opacity: 0.7;
                text-transform: none;
            }

            select,
            input[type="range"] {
                width: 100%;
            }

            select {
                background: var(--color-background-darkest);
                color: var(--color-accent-complement-lighter);
                border: 1px solid #555;
                border-radius: var(--border-radius-standard);
                padding: 0.25em 0.35em;
                cursor: pointer;

                &:focus {
                    outline: 1px solid var(--color-accent);
                }
            }

            input[type="range"] {
                accent-color: var(--color-accent);
            }
        }

        .test-btn {
            align-self: flex-start;
            background: var(--color-background-darkest);
            color: var(--color-accent);
            border: 1px solid #555;
            border-radius: var(--border-radius-standard);
            padding: 0.25em 0.7em;
            font-size: 0.8em;
            cursor: pointer;

            &:hover {
                border-color: var(--color-accent);
            }
        }
    }

    .media-thumbnails {
        margin-top: 1em;

        .media-header {
            font-size: 0.8em;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5em;
            opacity: 0.9;
        }

        .media-grid {
            display: flex;
            flex-direction: column;
            gap: 0.5em;
            padding-inline: 0.5rem;

            :global(.media-thumb) {
                border-radius: 10px;
                cursor: pointer;
                transition: transform 0.2s ease;
                width: 100%;
                height: auto;
            }
        }
    }
</style>
