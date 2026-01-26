<script>
    import toast from "$lib/toast"
    import {
        setOpenAITtsConfig,
        ttsListVoices,
        ttsSpeak,
        ttsSpeaking,
        ttsStop,
        voiceSettings,
    } from "$lib/voice/tts"
    import { onMount } from "svelte"

    let availableVoices = []
    let loadingVoices = false
    let openaiEndpoint = ""
    let openaiApiKey = ""
    let loadError = ""

    onMount(() => {
        initializeOpenAIConfig()
        const unsubscribe = voiceSettings.subscribe((v) => {
            openaiEndpoint = v.openaiTtsEndpoint
            openaiApiKey = v.openaiTtsApiKey
        })
        return () => unsubscribe()
    })

    async function loadVoices() {
        loadingVoices = true
        loadError = ""
        try {
            availableVoices = await ttsListVoices()
        } catch (e) {
            console.error("Failed to list voices", e)
            const errorMsg = e?.message || String(e)
            loadError = `Failed to load voices: ${errorMsg}`
            toast(loadError, "error")
        } finally {
            loadingVoices = false
        }
    }

    function initializeOpenAIConfig() {
        openaiEndpoint = $voiceSettings.openaiTtsEndpoint
        openaiApiKey = $voiceSettings.openaiTtsApiKey
    }

    async function saveOpenAIConfig() {
        const endpoint = openaiEndpoint.trim()
        const apiKey = openaiApiKey.trim()

        if (!endpoint) {
            toast("OpenAI endpoint is required", "error")
            return
        }

        try {
            setOpenAITtsConfig(endpoint, apiKey)
            loadError = ""
            toast("OpenAI TTS configured successfully", "success")
        } catch (e) {
            const errorMsg = e?.message || String(e)
            loadError = `Configuration failed: ${errorMsg}`
            toast(loadError, "error")
        }
    }

    // Load voices when TTS tab first activated
    // $: if (
    //     open &&
    //     activeTab === "tts" &&
    //     availableVoices.length === 0 &&
    //     !loadingVoices
    // ) {
    //     // initializeOpenAIConfig()
    //     // loadVoices()
    // }

    function updateVoiceSettings(patch) {
        voiceSettings.update((v) => ({ ...v, ...patch }))
    }
    function setEngine(id) {
        updateVoiceSettings({ ttsEngineId: id })
    }
    function setVoice(id) {
        updateVoiceSettings({ preferredVoice: id })
    }
    function setRate(e) {
        updateVoiceSettings({ rate: Number(e.target.value) })
    }
    function setPitch(e) {
        updateVoiceSettings({ pitch: Number(e.target.value) })
    }
    function setVolume(e) {
        updateVoiceSettings({ volume: Number(e.target.value) })
    }
    function setAutoSpeak(e) {
        updateVoiceSettings({ autoSpeak: e.target.checked })
    }

    const demoText = "This is a test of your text to speech settings."
    function testVoice() {
        if ($ttsSpeaking) {
            ttsStop()
            return
        }
        ttsSpeak(demoText)
    }
</script>

<!-- TTS Tab -->
<div class="form-group">
    <div class="field">
        <label title="Master enable / disable for all Text-To-Speech features.">
            Enable TTS
            <input
                type="checkbox"
                checked={$voiceSettings.enabled}
                on:change={(e) =>
                    updateVoiceSettings({
                        enabled: e.target.checked,
                    })}
            />
        </label>
    </div>
</div>
{#if $voiceSettings.enabled}
    <div class="form-group">
        <div class="field">
            <label
                title="Automatically speak assistant replies once they finish streaming."
            >
                Auto-speak replies
                <input
                    type="checkbox"
                    on:change={setAutoSpeak}
                    checked={$voiceSettings.autoSpeak}
                />
            </label>
        </div>
    </div>
    <div class="form-group">
        <div class="field">
            <label title="Select which TTS engine to configure">
                TTS Engine
                <div class="engine-selector">
                    <label class="radio-option">
                        <input
                            type="radio"
                            name="tts-engine"
                            value="webspeech"
                            checked={$voiceSettings.ttsEngineId === "webspeech"}
                            on:change={() => setEngine("webspeech")}
                        />
                        Browser Web Speech
                    </label>
                    <label class="radio-option">
                        <input
                            type="radio"
                            name="tts-engine"
                            value="openai"
                            checked={$voiceSettings.ttsEngineId === "openai"}
                            on:change={() => setEngine("openai")}
                        />
                        OpenAI TTS
                    </label>
                </div>
            </label>
        </div>
    </div>
    {#if $voiceSettings.ttsEngineId === "openai"}
        <div class="form-group row">
            <div class="field">
                <label title="OpenAI TTS API endpoint">
                    OpenAI Endpoint
                    <input
                        type="text"
                        placeholder="https://api.openai.com/v1"
                        bind:value={openaiEndpoint}
                    />
                </label>
            </div>
            <div class="field">
                <label title="OpenAI API key (optional)">
                    API Key (Optional)
                    <input
                        type="password"
                        placeholder="sk-..."
                        bind:value={openaiApiKey}
                    />
                </label>
            </div>
            <div class="field save-config action">
                <label title="Save OpenAI configuration">
                    <button
                        type="button"
                        on:click={saveOpenAIConfig}
                        disabled={loadingVoices}
                    >
                        Save Config
                    </button>
                </label>
            </div>
        </div>
        {#if loadError}
            <div
                style="color: #ff6b6b; font-size: 0.9rem; margin-bottom: 0.5rem;"
            >
                {loadError}
            </div>
        {/if}
    {/if}
    <div class="form-group row">
        <div class="field">
            <label title="Speech rate (0.5 - 2.0 typical)">
                Rate
                <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.05"
                    value={$voiceSettings.rate}
                    on:input={setRate}
                />
                <div class="small-value">
                    {$voiceSettings.rate.toFixed(2)}
                </div>
            </label>
        </div>
        <div class="field">
            <label title="Speech pitch (0 - 2)">
                Pitch
                <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.05"
                    value={$voiceSettings.pitch}
                    on:input={setPitch}
                />
                <div class="small-value">
                    {$voiceSettings.pitch.toFixed(2)}
                </div>
            </label>
        </div>
        <div class="field">
            <label title="Speech volume (0 - 1)">
                Volume
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={$voiceSettings.volume}
                    on:input={setVolume}
                />
                <div class="small-value">
                    {$voiceSettings.volume.toFixed(2)}
                </div>
            </label>
        </div>
    </div>

    <div class="form-group">
        <div class="field">
            <label title="Select voice (browser dependent)">
                Voice
                <select
                    disabled={loadingVoices || availableVoices.length === 0}
                    bind:value={$voiceSettings.preferredVoice}
                    on:change={(e) => setVoice(e.target.value)}
                >
                    <option value="">(Default)</option>
                    {#each availableVoices as v}
                        <option value={v.id}
                            >{v.name}
                            {v.lang ? `(${v.lang})` : ""}</option
                        >
                    {/each}
                </select>
            </label>
            <label>
                <button
                    type="button"
                    on:click={loadVoices}
                    disabled={loadingVoices}
                >
                    {loadingVoices ? "Loading…" : "Refresh Voices"}
                </button>
            </label>
        </div>
        <div class="field">
            <label title="Preview current TTS settings">
                Test Voice
                <button type="button" on:click={testVoice}>
                    {$ttsSpeaking ? "Stop" : "Speak Test"}
                </button>
            </label>
        </div>
    </div>
{/if}

<style>
    .tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        button {
            background: #111;
            color: var(--color-accent);
            border: 1px solid #444;
            padding: 0.5rem 0.75rem;
            cursor: pointer;
            border-radius: var(--border-radius-standard);
            font-weight: 600;
        }
        button.active {
            background: var(--color-background-lighter);
            border-color: var(--color-accent);
        }
    }
    .form-group {
        * {
            box-sizing: border-box !important;
        }

        margin-bottom: 1rem;
        display: flex;
        gap: 1rem;

        > div {
            flex: 1;
        }

        &.row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.5rem;
            align-items: end;
        }

        .field {
            display: block;
            label {
                display: block;
                font-weight: 500;
                width: 100%;
                color: var(--color-accent-lighter);
                input,
                textarea {
                    margin-top: 0.25rem;
                }

                input[type="text"],
                input[type="password"] {
                    width: 100%;
                    padding: 0.5rem;
                    border-radius: var(--border-radius-standard);
                    border: 1px solid #555;
                    background-color: #111;
                    color: var(--color-accent);
                    font-family: monospace;
                    /* box-sizing: border-box; */
                }

                textarea {
                    width: 100%;
                    padding: 0.5rem;
                    border-radius: var(--border-radius-standard);
                    border: 1px solid #555;
                    background-color: #111;
                    color: var(--color-accent);
                    resize: vertical;
                    /* box-sizing: border-box; */
                    font-family: monospace;
                }

                input[type="checkbox"],
                select,
                button,
                input[type="range"] {
                    margin-right: 0.5rem;
                }
                select,
                button,
                input[type="range"] {
                    width: 100%;
                    padding: 0.4rem;
                    border-radius: var(--border-radius-standard);
                    border: 1px solid #555;
                    background-color: #111;
                    color: var(--color-accent);
                    font-family: monospace;
                }
                input[type="range"] {
                    padding: 0;
                }
                .small-value {
                    font-size: 0.75rem;
                    opacity: 0.7;
                }
            }
            &.action {
                align-self: stretch;
                label {
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                    height: 100%;
                }
                button {
                    width: 100%;
                }
            }
        }
    }

    .engine-selector {
        display: flex;
        gap: 1rem;
        margin-top: 0.5rem;

        .radio-option {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: var(--border-radius-standard);
            background-color: #111;
            border: 1px solid #555;
            transition: all 0.2s;

            input[type="radio"] {
                margin: 0;
                cursor: pointer;
            }

            &:has(input:checked) {
                background-color: var(--color-background-lighter);
                border-color: var(--color-accent);
                color: var(--color-accent);
            }
        }
    }
</style>
