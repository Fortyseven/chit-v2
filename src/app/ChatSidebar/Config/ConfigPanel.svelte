<script>
    import { appState } from "$lib/appState/appState"
    import {
        appStateSetBackpackApiEndpoint,
        appStateSetChatApiEndpoint,
    } from "$lib/appState/appStateActions"
    import { DEFAULT_OL_ENDPOINT } from "../../../lib/appState/appState"
    import Modal from "../../UI/Modal.svelte"

    export let open = false
</script>

{#if open}
    <Modal title="Configuration Panel" {open}>
        <div class="form-group">
            <div>
                <label title="Enable or disable audio feedback.">
                    Audio feedback
                    <input
                        type="checkbox"
                        bind:checked={$appState.soundEnabled}
                    />
                </label>
            </div>
            <div>
                <label title="Enable or disable the use of the titler.">
                    Use Titler
                    <input type="checkbox" bind:checked={$appState.useTitler} />
                </label>
            </div>
            <div>
                <label title="Resize images on paste">
                    Resize images for inference
                    <input
                        type="checkbox"
                        bind:checked={$appState.resizeImages}
                    />
                </label>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label
                    for="ollama-api-endpoint"
                    title="The API endpoint for Ollama with a specific URL."
                    >Ollama API Endpoint
                    <input
                        id="ollama-api-endpoint"
                        type="text"
                        placeholder={DEFAULT_OL_ENDPOINT}
                        value={$appState.chatApiEndpoint}
                        on:input={(e) =>
                            appStateSetChatApiEndpoint(e.target.value)}
                        on:focusout={(e) => {
                            if (e.target.value === "") {
                                appStateSetChatApiEndpoint(DEFAULT_OL_ENDPOINT)
                            }
                        }}
                    />
                </label>
            </div>
        </div>

        <div class="form-group">
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

        <div class="form-group">
            <label
                for="default-prompt"
                title="Prompt that populates the system prompt for all new sessions when not loaded from a preset."
                >Default Prompt
                <textarea
                    id="default-prompt"
                    rows="4"
                    placeholder="Enter your default prompt here..."
                    bind:value={$appState.defaultPrompt}
                ></textarea>
            </label>
        </div>
    </Modal>
{/if}

<style>
    .form-group {
        margin-bottom: 1rem;

        display: flex;

        > div {
            flex: 1;
        }

        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
        }

        input[type="text"] {
            width: 100%;
            padding: 0.5em;
            border-radius: var(--border-radius-standard);
            border: 1px solid #555;
            background-color: #444;
            color: white;
            font-family: monospace;
            box-sizing: border-box;
        }

        textarea {
            width: 100%;
            padding: 0.5em;
            border-radius: var(--border-radius-standard);
            border: 1px solid #555;
            background-color: #444;
            color: white;
            resize: vertical;
            box-sizing: border-box;
            font-family: monospace;
        }

        input[type="checkbox"] {
            margin-right: 0.5rem;
        }
    }
</style>
