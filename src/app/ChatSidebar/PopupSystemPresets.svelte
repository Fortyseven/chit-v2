<script>
    import { appState } from "$lib/appState/appState"
    import {
        chatNew,
        chatSetSystemPrompt,
        chatUpdateSettings,
    } from "$lib/chatSession/chatActions"
    import { loadPresetFromFile, savePresetToFile } from "$lib/presets/presets"
    import { onDestroy, onMount } from "svelte"
    import { Chevron_right, Expand_more, Open_in_browser, Save } from "svelte-google-materialdesign-icons"
    import PROMPTS from "../../preset-prompts/index.js"

    export let open = false
    let appendMode = false
    let expandedSections = {
        default: true,
    }

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
    {#each Object.keys(PROMPTS) as section}
        {#if section !== "default"}
            <button class="btn-section-header" onclick={() => expandedSections[section] = !expandedSections[section]}>
                <span class="chevron">
                    {#if expandedSections[section]}
                        <Expand_more size={16} />
                    {:else}
                        <Chevron_right size={16} />
                    {/if}
                </span>
                <span class="section-name">{section.charAt(0).toUpperCase() + section.slice(1)}</span>
            </button>
        {/if}

        {#if section === "default" || expandedSections[section]}
            {#each Object.keys(PROMPTS[section]) as prompt}
            {@const p = PROMPTS[section][prompt]}
            {@const icon = p.icon ? p.icon : null}

                <button class="btn-preset" onclick={() => selectPrompt(p)} style="">
                    {#if icon}
                        <span class="preset-icon" style="vertical-align: middle;  color: var(--color-accent-complement);">
                            <svelte:component this={icon} size={"1em"} />
                        </span>
                    {/if}
                    {p.name}{appendMode ? " +" : ""}
                </button>
            {/each}
        {/if}
    {/each}

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
            <Save /> Save
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
            <Open_in_browser /> Load
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

        button.btn-section-header {
            background-color: transparent;
            color: var(--color-accent-complement);
            text-align: left;
            display: flex;
            align-items: flex-start;
            gap: 0.5em;
            font-weight: 600;
            font-size: 0.95em;
            padding: 0.25em 0 0.25em 0;
            place-content: unset;

            .chevron {
                display: flex;
                align-items: flex-start;
                justify-content: flex-start;
                width: 1em;
                height: 1em;
            }

            &:hover {
                background-color: var(--color-accent-lighter);
                color: var(--color-accent-text);
            }
        }

        button.btn-preset {
            background-color: transparent;
            color: var(--color-accent);
            font-weight: 200;
            text-align: left;
            line-height: 0;
            height: 1.4em;
            padding-left: 1.5em;
            font-size: 0.9rem;
            padding-block: 0.2em;

            .preset-icon  {
                color: #fff !important;
                margin-right: 0.25rem;
            }

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
            margin-top: 0.5rem;

            button {
                line-height: 1em;
                vertical-align: middle;
                align-self: flex-start;

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
