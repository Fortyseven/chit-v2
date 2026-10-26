<script>
    import { appState } from "$lib/appState/appState"
    import {
        appStateSetModalityBase,
        appStateSetModalityKey,
        appStateSetModalityModel,
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

<!-- --------------------------------------------- -->

<h3 class="section-title">
    Modality Endpoint <span class="optional">(optional)</span>
</h3>
<p class="section-note">
    Auxiliary OpenAI-compatible endpoint reserved for special modality features.
    Normal chat calls always use the OpenAI endpoint above. Leave blank for
    none.
</p>

<div class="form-group row">
    <div class="field">
        <label
            for="modality-base"
            title="Optional auxiliary OpenAI-compatible base URL used only by special modality features. Leave blank for none."
        >
            Modality Base URL
            <input
                id="modality-base"
                type="text"
                placeholder="https://api.openai.com/v1"
                value={$appState.modalityApiBase}
                on:input={(e) => {
                    appStateSetModalityBase(e.target.value)
                }}
            />
        </label>
    </div>

    <div class="field">
        <label for="modality-key" title="API key for the modality endpoint">
            Modality API Key
            <input
                id="modality-key"
                type="password"
                value={$appState.modalityApiKey}
                on:input={(e) => appStateSetModalityKey(e.target.value)}
            />
        </label>
    </div>
</div>

<div class="form-group row">
    <div class="field">
        <label
            for="modality-model"
            title="Model name sent to the modality endpoint for image descriptions"
        >
            Modality Model
            <input
                id="modality-model"
                type="text"
                placeholder="model name"
                value={$appState.modalityModel}
                on:input={(e) => appStateSetModalityModel(e.target.value)}
            />
        </label>
    </div>
</div>

<div class="form-group">
    <div class="field">
        <label
            title="If the chat's current model can read images, describe them with it instead of calling the modality endpoint."
        >
            Use primary modality if available
            <input
                type="checkbox"
                bind:checked={$appState.modalityUsePrimary}
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

    .section-title {
        margin: 1rem 0 0.25rem;
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-accent-lighter);

        .optional {
            font-weight: 400;
            font-size: 0.85em;
            opacity: 0.6;
        }
    }

    .section-note {
        margin: 0 0 0.75rem;
        font-size: 0.8rem;
        line-height: 1.4;
        opacity: 0.7;
    }
</style>
