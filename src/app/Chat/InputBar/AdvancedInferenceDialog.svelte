<script lang="ts">
    import { advancedInferenceDialogOpen } from "$lib/appState/advancedInferenceDialogState"
    import { chatUpdateSettings } from "$lib/chatSession/chatActions"
    import { currentChat } from "$lib/chatSession/chatSession"
    import { onDestroy } from "svelte"

    $: settings = $currentChat?.settings

    function close() {
        $advancedInferenceDialogOpen = false
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape" && $advancedInferenceDialogOpen) close()
    }

    $: {
        if ($advancedInferenceDialogOpen) {
            window.addEventListener("keydown", handleKeydown)
        } else {
            window.removeEventListener("keydown", handleKeydown)
        }
    }

    onDestroy(() => {
        window.removeEventListener("keydown", handleKeydown)
    })

    function parseOptionalFloat(val: string): number | undefined {
        const trimmed = val.trim()
        if (trimmed === "") return undefined
        const n = parseFloat(trimmed)
        return isNaN(n) ? undefined : n
    }

    function parseOptionalInt(val: string): number | undefined {
        const trimmed = val.trim()
        if (trimmed === "") return undefined
        const n = parseInt(trimmed, 10)
        return isNaN(n) ? undefined : n
    }

    function onTopP(e: Event) {
        const val = parseOptionalFloat((e.target as HTMLInputElement).value)
        chatUpdateSettings("", { top_p: val })
    }

    function onPresencePenalty(e: Event) {
        const val = parseOptionalFloat((e.target as HTMLInputElement).value)
        chatUpdateSettings("", { presence_penalty: val })
    }

    function onRepeatPenalty(e: Event) {
        const val = parseOptionalFloat((e.target as HTMLInputElement).value)
        chatUpdateSettings("", { repeat_penalty: val })
    }

    function onTopK(e: Event) {
        const val = parseOptionalInt((e.target as HTMLInputElement).value)
        chatUpdateSettings("", { top_k: val })
    }

    function onSeed(e: Event) {
        const val = parseOptionalInt((e.target as HTMLInputElement).value)
        chatUpdateSettings("", { seed: val })
    }
</script>

{#if $advancedInferenceDialogOpen}
    <div class="adv-overlay">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="backdrop" on:click={close}></div>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="adv-modal" on:click|stopPropagation>
            <h2>Advanced Inference Settings</h2>
            <p class="hint">
                Leave a field blank to use the model default. Changes apply to
                the current conversation only.
            </p>
            <div class="fields">
                <label>
                    <span>Top K</span>
                    <span class="desc"
                        >Limit sampling to top K candidates (llama.cpp, vllm,
                        Ollama)</span
                    >
                    <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="default"
                        value={settings?.top_k ?? ""}
                        on:change={onTopK}
                    />
                </label>
                <label>
                    <span>Top P</span>
                    <span class="desc">Nucleus sampling threshold (0–1)</span>
                    <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        placeholder="default"
                        value={settings?.top_p ?? ""}
                        on:change={onTopP}
                    />
                </label>

                <label>
                    <span>Presence Penalty</span>
                    <span class="desc"
                        >Penalise tokens that have appeared (−2 to 2)</span
                    >
                    <input
                        type="number"
                        min="-2"
                        max="2"
                        step="0.01"
                        placeholder="default"
                        value={settings?.presence_penalty ?? ""}
                        on:change={onPresencePenalty}
                    />
                </label>

                <label>
                    <span>Repeat Penalty</span>
                    <span class="desc"
                        >Penalise repeated tokens (Ollama) / frequency_penalty
                        (OpenAI)</span
                    >
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="default"
                        value={settings?.repeat_penalty ?? ""}
                        on:change={onRepeatPenalty}
                    />
                </label>

                <label>
                    <span>Seed</span>
                    <span class="desc"
                        >Deterministic sampling seed (integer)</span
                    >
                    <input
                        type="number"
                        step="1"
                        placeholder="random"
                        value={settings?.seed ?? ""}
                        on:change={onSeed}
                    />
                </label>
            </div>
            <button on:click={close} style="float: right;">Close</button>
        </div>
    </div>
{/if}

<style lang="scss">
    .adv-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        pointer-events: none;

        .backdrop {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            pointer-events: auto;
        }

        .adv-modal {
            position: relative;
            background: #222;
            color: white;
            width: 80%;
            max-width: 800px;
            padding: 1em;
            border-radius: var(--border-radius-standard);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            pointer-events: auto;
            box-sizing: border-box;

            h2 {
                padding: 0;
                margin: 0 0 1em 0;
                padding-bottom: 0.5em;
                border-bottom: 1px solid #555;
            }
        }
    }

    .hint {
        color: var(--color-text-muted, #888);
        font-size: 0.85em;
        margin: 0 0 1em 0;
    }

    .fields {
        display: flex;
        flex-direction: column;
        gap: 0.75em;
        margin-bottom: 1em;

        label {
            display: grid;
            grid-template-columns: 1fr 2fr auto;
            align-items: center;
            gap: 0.75em;

            span {
                font-weight: bold;
            }

            .desc {
                font-size: 0.8em;
                color: var(--color-text-muted, #888);
                font-weight: normal;
            }

            input {
                font-family: monospace;
                background: var(--color-background-darkest);
                border: 1px solid var(--color-border, #444);
                padding: 0.3em 0.5em;
                color: var(--color-accent-tertiary-lightest);
                width: 8em;

                &:focus {
                    outline: 1px solid var(--color-accent);
                    color: var(--color-accent);
                }
            }
        }
    }
</style>
