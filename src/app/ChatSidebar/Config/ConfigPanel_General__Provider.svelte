<script>
    import { appState, DEFAULT_OL_ENDPOINT } from "$lib/appState/appState"
    import {
        appStateSetChatApiEndpoint,
        appStateSetOpenAIBase,
        appStateSetOpenAIKey,
        appStateSetSelectedProvider,
    } from "$lib/appState/appStateActions"

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
        <label title="Select which LLM provider to configure">
            LLM Provider
            <div class="provider-selector">
                <label class="radio-option">
                    <input
                        type="radio"
                        name="provider"
                        value="ollama"
                        checked={$appState.selectedProvider === "ollama"}
                        on:change={() => appStateSetSelectedProvider("ollama")}
                    />
                    Ollama
                </label>
                <label class="radio-option">
                    <input
                        type="radio"
                        name="provider"
                        value="openai"
                        checked={$appState.selectedProvider === "openai"}
                        on:change={() => appStateSetSelectedProvider("openai")}
                    />
                    OpenAI
                </label>
            </div>
        </label>
    </div>
</div>

{#if $appState.selectedProvider === "ollama"}
    <div class="form-group">
        <div class="field">
            <label
                for="ollama-api-endpoint"
                title="The API endpoint for Ollama with a specific URL."
            >
                Ollama API Endpoint
                <div class="input-with-button">
                    <input
                        id="ollama-api-endpoint"
                        type="text"
                        placeholder={DEFAULT_OL_ENDPOINT}
                        value={$appState.chatApiEndpoint}
                        on:input={(e) => appStateSetChatApiEndpoint(e.target.value)}
                    />
                    <button
                        type="button"
                        on:click={() => appStateSetChatApiEndpoint(DEFAULT_OL_ENDPOINT)}
                    >
                        Reset
                    </button>
                </div>
            </label>
        </div>
    </div>
{:else if $appState.selectedProvider === "openai"}
    <div class="form-group row">
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
                    on:input={(e) => {
                        appStateSetOpenAIBase(e.target.value)
                    }}
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
                    on:input={(e) => appStateSetOpenAIKey(e.target.value)}
                />
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
