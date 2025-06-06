<script>
    import {
        CloudUpload,
        WatsonHealthSaveAnnotation,
    } from "carbon-icons-svelte"
    import { onDestroy, onMount } from "svelte"
    import { appState } from "../../lib/appState/appState"
    import {
        chatNew,
        chatSetSystemPrompt,
        chatUpdateSettings,
    } from "../../lib/chatSession/chatActions"
    import {
        loadPresetFromFile,
        savePresetToFile,
    } from "../../lib/presets/presets"
    import { FUN_PROMPTS, SYSTEM_PROMPTS } from "../../preset-prompts/index.js"

    export let open = false
    let appendMode = false

    function selectPrompt(prompt_def) {
        if (prompt_def.temperature) {
            chatUpdateSettings($appState.activeChatId, {
                temperature: prompt_def.temperature,
            })
        }

        if (!appendMode) {
            chatNew()
        }
        chatSetSystemPrompt($appState.activeChatId, prompt_def.prompt)

        open = false
    }

    function handleKeyDown(event) {
        if (event.key === "Shift") {
            appendMode = true
        }
    }

    function handleKeyUp(event) {
        if (event.key === "Shift") {
            appendMode = false
        }
    }

    onMount(() => {
        window.addEventListener("keydown", handleKeyDown)
        window.addEventListener("keyup", handleKeyUp)
    })

    onDestroy(() => {
        window.removeEventListener("keydown", handleKeyDown)
        window.removeEventListener("keyup", handleKeyUp)
    })
</script>

<div class="system-presets-popup" class:open>
    {#each Object.keys(SYSTEM_PROMPTS) as skey}
        {@const p = SYSTEM_PROMPTS[skey]}
        <button class="btn-preset" onclick={() => selectPrompt(p)}>
            {p.name}{appendMode ? " +" : ""}
        </button>
    {/each}
    <hr />
    {#each Object.keys(FUN_PROMPTS) as skey}
        {@const p = FUN_PROMPTS[skey]}
        <button class="btn-preset" onclick={() => selectPrompt(p)}>
            {p.name}{appendMode ? " +" : ""}
        </button>
    {/each}
    <hr />
    <div class="btn-load-save">
        <button
            class="btn-save small"
            title="Save Preset"
            onclick={() => {
                // alert("Saving presets is not yet implemented. One sec...")
                savePresetToFile()
                open = false
                // pushToRecents($appState.activeChatId.systemPrompt)
            }}
        >
            <WatsonHealthSaveAnnotation /> Save
        </button>
        <button
            class="btn-load small"
            title="Load Preset"
            onclick={() => {
                try {
                    chatNew()
                    loadPresetFromFile()
                    open = false
                    // pushToRecents($appState.activeChatId.systemPrompt)
                } catch (e) {
                    console.error("Error loading preset:", e)
                }
            }}
        >
            <CloudUpload /> Load
        </button>
    </div>
    <hr />
</div>

<style lang="scss">
    .system-presets-popup {
        flex-direction: column;
        padding: 0.5em 0.5em;
        background-color: var(--color-background-lighter);
        box-shadow: 0 0 10px black;
        display: none;
        border-radius: var(--border-radius-standard);

        &.open {
            display: flex;
        }

        button.btn-preset {
            background-color: transparent;
            color: var(--color-accent);
            text-align: left;
            line-height: 0.5;

            &:hover {
                background-color: var(--color-accent);
                color: var(--color-accent-text);
            }
        }

        hr {
            width: 75%;
            border: 0;
            border-top: 1px solid var(--color-accent-complement-darker);
        }

        .btn-load-save {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
            gap: 1px;

            button {
                line-height: 1em;
                vertical-align: middle;
                align-self: center;

                :global(svg) {
                    vertical-align: middle;
                }
                &:hover {
                    background-color: var(--color-accent-lighter);
                    color: var(--color-accent-text);
                }
            }

            button.btn-load {
                border-top-left-radius: 0;
                border-bottom-left-radius: 0;
            }
            button.btn-save {
                border-top-right-radius: 0em;
                border-bottom-right-radius: 0em;
            }
        }
    }
</style>
