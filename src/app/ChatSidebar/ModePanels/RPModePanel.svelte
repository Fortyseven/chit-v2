<script lang="ts">
    import { ChatMediaType } from "$lib/chatSession/chatAttachments"
    import {
        AppMode,
        currentChat,
        currentChatMode,
    } from "$lib/chatSession/chatSession"
    import { ttsListVoices, voiceSettings } from "$lib/voice/tts"
    import { onMount } from "svelte"
    import AsyncMediaImage from "../../components/AsyncMediaImage.svelte"

    $: currentMode = $currentChatMode

    // Get all image attachments from the current chat session
    $: allImageMedia =
        $currentChat?.messages
            ?.flatMap((message) => message.media || [])
            ?.filter((media) => media.type === ChatMediaType.IMAGE) || []

    let availableVoices: { id: string; name: string; lang?: string }[] = []

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
        voiceSettings.update((v) => ({ ...v, preferredVoice: val || null }))
    }
</script>

{#if currentMode === AppMode.RP}
    <div class="rp-mode-panel">
        <div class="mode-badge">
            <span class="mode-icon">🎭</span>
            <span class="mode-text">RP Mode</span>
        </div>
        {#if $voiceSettings.enabled && availableVoices.length > 0}
            <div class="voice-picker">
                <div class="section-header">Voice</div>
                <select
                    value={$voiceSettings.preferredVoice ?? ""}
                    on:change={setVoice}
                >
                    <option value="">(Default)</option>
                    {#each availableVoices as v}
                        <option value={v.id}
                            >{v.name}{v.lang ? ` (${v.lang})` : ""}</option
                        >
                    {/each}
                </select>
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

    .voice-picker {
        margin-top: 1em;

        .section-header {
            font-size: 0.8em;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5em;
            opacity: 0.9;
        }

        select {
            width: 100%;
            background: var(--color-background-darkest);
            color: var(--color-accent-complement-lighter);
            border: 1px solid #444;
            border-radius: var(--border-radius-standard);
            padding: 0.3em 0.4em;
            font-size: 0.85em;
            cursor: pointer;

            &:focus {
                outline: 1px solid var(--color-accent);
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
