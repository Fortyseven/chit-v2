<script>
    import { appState } from "$lib/appState/appState"
    import {
        appStateSetBackpackApiEndpoint,
        appStateSetDefaultContext,
        appStateSetDefaultModel,
        appStateSetDefaultTemperature,
    } from "$lib/appState/appStateActions"

    let selectedProvider = "ollama"

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
</script>

<div class="form-group">
    <div class="field">
        <label title="Enable or disable audio feedback.">
            Audio feedback
            <input type="checkbox" bind:checked={$appState.soundEnabled} />
        </label>
    </div>

    <div class="field">
        <label title="Enable or disable the use of the titler.">
            Use Titler
            <input type="checkbox" bind:checked={$appState.useTitler} />
        </label>
    </div>

    <div class="field">
        <label title="Resize images on paste">
            Resize images for inference
            <input type="checkbox" bind:checked={$appState.resizeImages} />
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
                on:input={(e) => appStateSetDefaultModel(e.target.value)}
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
                on:input={(e) => appStateSetDefaultContext(e.target.value)}
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
                on:input={(e) => appStateSetDefaultTemperature(e.target.value)}
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
                on:input={(e) => appStateSetBackpackApiEndpoint(e.target.value)}
            />
        </label>
    </div>
</div>

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

    .provider-selector {
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

    .input-with-button {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.25rem;

        input {
            flex: 1;
        }

        button {
            width: auto !important;
            padding: 0.5rem 1rem;
            white-space: nowrap;
            flex-shrink: 0;
        }
    }
</style>
