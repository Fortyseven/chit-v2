<script lang="ts">
    import { appState } from "$lib/appState/appState"
    import { appStateSetMediaServerUrl } from "$lib/appState/appStateActions"
</script>

<div class="form-group row">
    <div class="field">
        <label
            for="media-server-url"
            title="OpenAI-compatible media server base URL for image generation"
        >
            Media Server URL
            <input
                id="media-server-url"
                type="text"
                placeholder="http://example.com"
                value={$appState.mediaServerUrl}
                on:input={(e) => appStateSetMediaServerUrl(e.target.value)}
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
