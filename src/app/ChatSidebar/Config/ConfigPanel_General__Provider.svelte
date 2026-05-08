<script>
    import { appState } from "$lib/appState/appState"
    import {
        appStateSetOpenAIBase,
        appStateSetOpenAIKey,
    } from "$lib/appState/appStateActions"
</script>

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
                }
            }
        }
    }
</style>
