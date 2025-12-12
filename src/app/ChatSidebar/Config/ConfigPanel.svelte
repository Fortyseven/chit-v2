<script>
    import { appState, DEFAULT_OL_ENDPOINT } from "$lib/appState/appState"
    import {
        appStateSetBackpackApiEndpoint,
        appStateSetChatApiEndpoint,
        appStateSetDefaultContext,
        appStateSetDefaultModel,
        appStateSetDefaultTemperature,
        appStateSetOpenAIBase,
        appStateSetOpenAIKey,
    } from "$lib/appState/appStateActions"
    import {
        ttsListVoices,
        ttsSpeak,
        ttsSpeaking,
        ttsStop,
        voiceSettings,
    } from "$lib/voice/tts"
    import Modal from "../../UI/Modal.svelte"

    export let open = false

    let activeTab = "general"
    let availableVoices = []
    let loadingVoices = false

    async function loadVoices() {
        loadingVoices = true
        try {
            availableVoices = await ttsListVoices()
        } catch (e) {
            console.warn("Failed to list voices", e)
        } finally {
            loadingVoices = false
        }
    }

    // Load voices when TTS tab first activated
    $: if (
        open &&
        activeTab === "tts" &&
        availableVoices.length === 0 &&
        !loadingVoices
    ) {
        loadVoices()
    }

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

{#if open}
    <Modal title="Configuration Panel" {open}>
        <div class="tabs">
            <button
                class:active={activeTab === "general"}
                on:click={() => (activeTab = "general")}>General</button
            >
            <button
                class:active={activeTab === "tts"}
                on:click={() => (activeTab = "tts")}>TTS</button
            >
        </div>

        {#if activeTab === "general"}
            <!-- General Tab -->
            <div class="form-group">
                <div class="field">
                    <label title="Enable or disable audio feedback.">
                        Audio feedback
                        <input
                            type="checkbox"
                            bind:checked={$appState.soundEnabled}
                        />
                    </label>
                </div>

                <div class="field">
                    <label title="Enable or disable the use of the titler.">
                        Use Titler
                        <input
                            type="checkbox"
                            bind:checked={$appState.useTitler}
                        />
                    </label>
                </div>

                <div class="field">
                    <label title="Resize images on paste">
                        Resize images for inference
                        <input
                            type="checkbox"
                            bind:checked={$appState.resizeImages}
                        />
                    </label>
                </div>
            </div>

            <!-- --------------------------------------------- -->

            <div class="form-group row">
                <div class="field">
                    <label
                        for="ollama-api-endpoint"
                        title="The API endpoint for Ollama with a specific URL."
                    >
                        Ollama API Endpoint <button
                            class="trans"
                            type="button"
                            on:click={() =>
                                appStateSetChatApiEndpoint(DEFAULT_OL_ENDPOINT)}
                        >
                            ⏎
                        </button>
                        <div>
                            <input
                                id="ollama-api-endpoint"
                                type="text"
                                placeholder={DEFAULT_OL_ENDPOINT}
                                value={$appState.chatApiEndpoint}
                                on:input={(e) =>
                                    appStateSetChatApiEndpoint(e.target.value)}
                            />
                        </div>
                    </label>
                </div>

                <div class="field">
                    <label
                        for="openai-base"
                        title="OpenAI-compatible API base URL (e.g., https://api.openai.com/v1)"
                    >
                        OpenAI Base URL
                        <input
                            id="openai-base"
                            type="text"
                            placeholder="https://api.openai.com/v1"
                            value={$appState.openaiApiBase}
                            on:input={(e) =>
                                appStateSetOpenAIBase(e.target.value)}
                        />
                    </label>
                </div>

                <div class="field">
                    <label
                        for="openai-key"
                        title="OpenAI API key or compatible provider key"
                    >
                        OpenAI API Key
                        <input
                            id="openai-key"
                            type="password"
                            value={$appState.openaiApiKey}
                            on:input={(e) =>
                                appStateSetOpenAIKey(e.target.value)}
                        />
                    </label>
                </div>
            </div>

            <!-- --------------------------------------------- -->

            <div class="form-group">
                <div class="field">
                    <label
                        for="default-prompt"
                        title="Prompt that populates the system prompt for all new sessions when not loaded from a preset."
                        >Default Prompt (defaults to 'General Query' if blank)
                        <textarea
                            id="default-prompt"
                            rows="4"
                            placeholder="Enter your default prompt here..."
                            bind:value={$appState.defaultPrompt}
                        ></textarea>
                    </label>
                </div>
            </div>

            <!-- --------------------------------------------- -->

            <div class="form-group row">
                <div class="field">
                    <label
                        for="default-ollama-model"
                        title="Default Ollama model to use for new conversations. Leave blank to use the built-in default."
                        >Default Ollama Model
                        <input
                            id="default-ollama-model"
                            type="text"
                            placeholder="e.g. gemma3:12b, llama3, etc."
                            value={$appState.defaultModel}
                            on:input={(e) =>
                                appStateSetDefaultModel(e.target.value)}
                        />
                    </label>
                </div>
                <div class="field">
                    <label
                        for="default-context-size"
                        title="Default context size for new conversations. Leave blank to use the built-in default."
                        >Default Context Size
                        <input
                            id="default-context-size"
                            type="text"
                            placeholder="e.g. 65536, 4096, etc."
                            value={$appState.defaultContext}
                            on:input={(e) =>
                                appStateSetDefaultContext(e.target.value)}
                        />
                    </label>
                </div>
                <div class="field">
                    <label
                        for="default-temperature"
                        title="Default temperature for new conversations. Leave blank to use the built-in default."
                        >Default Temperature
                        <input
                            id="default-temperature"
                            type="text"
                            placeholder="e.g. 0.7, 1.0, etc."
                            value={$appState.defaultTemperature}
                            on:input={(e) =>
                                appStateSetDefaultTemperature(e.target.value)}
                        />
                    </label>
                </div>
            </div>

            <hr />
            <br />

            <div class="form-group">
                <div class="field">
                    <label
                        for="backpack-api-endpoint"
                        title="The API endpoint for Chit Backpack."
                        >Chit Backpack Endpoint (Enables enhanced mode.)
                        <input
                            id="backpack-api-endpoint"
                            type="text"
                            value={$appState.backpackApiEndpoint}
                            on:input={(e) =>
                                appStateSetBackpackApiEndpoint(e.target.value)}
                        />
                    </label>
                </div>
            </div>
        {/if}

        {#if activeTab === "tts"}
            <!-- TTS Tab -->
            <div class="form-group">
                <div class="field">
                    <label
                        title="Master enable / disable for all Text-To-Speech features."
                    >
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
                <div class="form-group row">
                    <div class="field">
                        <label title="Select TTS engine">
                            Engine
                            <select
                                bind:value={$voiceSettings.ttsEngineId}
                                on:change={(e) => setEngine(e.target.value)}
                            >
                                <option value="webspeech"
                                    >Browser Web Speech</option
                                >
                            </select>
                        </label>
                    </div>
                    <div class="field">
                        <label title="Select voice (browser dependent)">
                            Voice
                            <select
                                disabled={loadingVoices ||
                                    availableVoices.length === 0}
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
                    </div>
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
                        <label
                            title="Refresh voice list (some browsers require user interaction)"
                        >
                            Refresh Voices
                            <button
                                type="button"
                                on:click={loadVoices}
                                disabled={loadingVoices}
                            >
                                {loadingVoices ? "Loading…" : "↺"}
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
        {/if}
    </Modal>
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
        }

        .field {
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
        }
    }
</style>
