<script>
    import ConfigPanel_General from "./ConfigPanel_General.svelte"
    import ConfigPanel_General__Provider from "./ConfigPanel_General__Provider.svelte"

    import ConfigPanel_TTS from "./ConfigPanel_TTS.svelte"

    import Modal from "../../UI/Modal.svelte"

    export let open = false

    let activeTab = "general"

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

{#if open}
    <Modal title="Configuration Panel" {open}>
        <div class="tabs">
            <button
                class:active={activeTab === "general"}
                on:click={() => (activeTab = "general")}>General</button
            >
            <button
                class:active={activeTab === "provider"}
                on:click={() => (activeTab = "provider")}>Provider</button
            >
            <button
                class:active={activeTab === "tts"}
                on:click={() => (activeTab = "tts")}>TTS</button
            >
        </div>

        {#if activeTab === "general"}
            <ConfigPanel_General></ConfigPanel_General>
        {/if}
        {#if activeTab === "provider"}
            <ConfigPanel_General__Provider></ConfigPanel_General__Provider>
        {/if}
        {#if activeTab === "tts"}
            <ConfigPanel_TTS></ConfigPanel_TTS>
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
