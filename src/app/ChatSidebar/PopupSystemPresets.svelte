<script>
    import { onDestroy, onMount } from "svelte"
    import { appState } from "../../lib/appState/appState"
    import {
        chatNew,
        chatSetSystemPrompt,
        chatUpdateSettings,
    } from "../../lib/chatSession/chatActions"
    import SYSTEM_PROMPTS from "../../preset-prompts/index.js"

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
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_missing_attribute -->
        <button
            type="button"
            class="btn-preset"
            on:click={() => selectPrompt(p)}
        >
            {p.name}{appendMode ? " +" : ""}
        </button>
    {/each}
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

            &:hover {
                background-color: var(--color-accent);
                color: var(--color-accent-text);
            }
        }
    }
</style>
