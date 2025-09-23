<script>
    import { appState } from "$lib/appState/appState"
    import {
        appStateSetBackpackApiEndpoint,
        appStateSetChatApiEndpoint,
        appStateSetDefaultContext,
        appStateSetDefaultModel,
        appStateSetDefaultTemperature,
        appStateSetOpenAIBase,
        appStateSetOpenAIKey,
    } from "$lib/appState/appStateActions"
    import { DEFAULT_OL_ENDPOINT } from "../../../lib/appState/appState"
    import Modal from "../../UI/Modal.svelte"

    export let open = false
</script>

{#if open}
    <Modal title="Configuration Panel" {open}>
        <!-- --------------------------------------------- -->

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
                    <input type="checkbox" bind:checked={$appState.useTitler} />
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
                        on:input={(e) => appStateSetOpenAIBase(e.target.value)}
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
    </Modal>
{/if}

<style>
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

                input[type="checkbox"] {
                    margin-right: 0.5rem;
                }
            }
        }
    }
</style>
