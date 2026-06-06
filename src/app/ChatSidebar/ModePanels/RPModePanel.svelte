<script lang="ts">
    import { chatSetTtsSettings } from "$lib/chatSession/chatActions"
    import { ChatMediaType } from "$lib/chatSession/chatAttachments"
    import {
        AppMode,
        currentChat,
        currentChatMode,
    } from "$lib/chatSession/chatSession"
    import { generateArtPrompt } from "$lib/inputCommands/generateArtPrompt"
    import {
        b64ToBlob,
        generateImage,
        getMediaServerUrl,
    } from "$lib/mediaServer/mediaServer"
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
    $: hasMediaServer = getMediaServerUrl().length > 0

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

    // Art generation state
    let artOpen = false
    let artImageBlob: Blob | null = null
    let artPrompt: string = ""
    let artLoading = false
    let artLoadingStage: "prompt" | "image" | null = null
    let artError: string | null = null
    let artModalOpen = false
    let artModalEl: HTMLElement | null = null

    async function generateArt() {
        artLoading = true
        artLoadingStage = "prompt"
        artError = null
        artImageBlob = null
        artPrompt = ""
        try {
            const prompt = await generateArtPrompt()
            artLoadingStage = "image"
            const response = await generateImage(prompt, {}, getMediaServerUrl())
            if (response.data.length > 0) {
                artImageBlob = b64ToBlob(response.data[0].b64_json)
                artPrompt = response.data[0].revised_prompt || prompt
            } else {
                artError = "No image returned from server"
            }
        } catch (err: any) {
            artError = err.message || "Failed to generate art"
            console.error("RPModePanel: art generation failed", err)
        } finally {
            artLoading = false
            artLoadingStage = null
        }
    }

    function openArtModal() {
        if (!artImageBlob || artModalEl) return

        const overlay = document.createElement("div")
        overlay.style.cssText = `
            position: fixed; inset: 0;
            display: flex; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.85);
            z-index: 10002; padding: 1em;
        `
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closeArtModal()
        })

        const modal = document.createElement("div")
        modal.style.cssText = `
            position: relative;
            max-width: 90vw; max-height: 90vh;
            display: flex; flex-direction: column;
            align-items: center; gap: 0.75em;
        `

        const closeBtn = document.createElement("button")
        closeBtn.textContent = "\u2715"
        closeBtn.style.cssText = `
            position: absolute; top: -0.6em; right: -0.6em;
            background: #111; color: #ccc;
            border: 1px solid #555; border-radius: 50%;
            width: 2em; height: 2em; font-size: 1em;
            cursor: pointer; display: flex;
            align-items: center; justify-content: center;
        `
        closeBtn.addEventListener("click", closeArtModal)

        const img = document.createElement("img")
        img.src = URL.createObjectURL(artImageBlob)
        img.alt = "Generated Art"
        img.style.cssText = `
            max-width: 85vw; max-height: 75vh;
            border-radius: 10px; object-fit: contain;
        `

        modal.appendChild(closeBtn)
        modal.appendChild(img)

        if (artPrompt) {
            const caption = document.createElement("div")
            caption.textContent = artPrompt
            caption.style.cssText = `
                max-width: 85vw; max-height: 10vh; overflow-y: auto;
                padding: 0.5em 0.75em;
                background: #111; border: 1px solid #444;
                border-radius: 6px; font-size: 0.8em;
                line-height: 1.4; color: #ccc;
                opacity: 0.9; text-align: center;
            `
            modal.appendChild(caption)
        }

        overlay.appendChild(modal)
        document.body.appendChild(overlay)
        artModalEl = overlay

        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeArtModal()
        }
        document.addEventListener("keydown", handleKey)
        overlay.__keydownHandler = handleKey
    }

    function closeArtModal() {
        if (artModalEl) {
            const handler = (artModalEl as any).__keydownHandler as ((e: KeyboardEvent) => void) | undefined
            if (handler) document.removeEventListener("keydown", handler)
            document.body.removeChild(artModalEl)
            artModalEl = null
        }
    }

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
        {#if hasMediaServer}
        <div class="art-accordion">
            <button
                class="accordion-header"
                class:open={artOpen}
                on:click={() => (artOpen = !artOpen)}
            >
                <span>🎨 Art</span>
                <span class="chevron">{artOpen ? "▲" : "▼"}</span>
            </button>
            {#if artOpen}
                <div class="accordion-body">
                    {#if artLoading}
                        <div class="art-loading">
                            {artLoadingStage === "prompt" ? "Generating prompt..." : "Generating image..."}
                        </div>
                    {:else if artError}
                        <div class="art-error">{artError}</div>
                    {:else if artImageBlob}
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                        <img
                            src={URL.createObjectURL(artImageBlob)}
                            class="art-image"
                            alt="Generated Art"
                            on:click={openArtModal}
                        />
                    {:else}
                        <div class="art-empty">No art generated yet</div>
                    {/if}
                    <button class="art-btn" on:click={generateArt} disabled={artLoading}>
                        {artLoading ? "⏳" : "+"} Generate
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

    .art-accordion {
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

        .art-image {
            border-radius: 10px;
            width: 100%;
            height: auto;
        }

        .art-loading,
        .art-error,
        .art-empty {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 60px;
            font-size: 0.8em;
            opacity: 0.7;
        }

        .art-error {
            color: var(--color-error-text, #ff6b6b);
            opacity: 1;
        }

        .art-btn {
            align-self: flex-start;
            background: var(--color-background-darkest);
            color: var(--color-accent);
            border: 1px solid #555;
            border-radius: var(--border-radius-standard);
            padding: 0.25em 0.7em;
            font-size: 0.8em;
            cursor: pointer;

            &:hover:not(:disabled) {
                border-color: var(--color-accent);
            }

            &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
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
