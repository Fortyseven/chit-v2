<script lang="ts">
    import { advancedInferenceDialogOpen } from "$lib/appState/advancedInferenceDialogState"
    import {
        chatSetToolsEnabled,
        chatUpdateSettings,
    } from "$lib/chatSession/chatActions"
    import { currentChat } from "$lib/chatSession/chatSession"
    import {
        Build,
        Psychology,
        Receipt_long,
        Thermostat,
    } from "svelte-google-materialdesign-icons"
    import { writable } from "svelte/store"

    let ctx = writable($currentChat?.settings?.num_ctx || 8192)
    let temp = writable($currentChat?.settings?.temperature || 0.6)
    let thinking = writable($currentChat?.settings?.enable_thinking ?? true)
    let toolsEnabled = writable($currentChat?.toolsEnabled ?? false)

    ctx.subscribe((value) => {
        chatUpdateSettings("", {
            num_ctx: value,
        })
    })

    temp.subscribe((value) => {
        chatUpdateSettings("", {
            temperature: value,
        })
    })

    thinking.subscribe((value) => {
        chatUpdateSettings("", {
            enable_thinking: value,
        })
    })

    toolsEnabled.subscribe((value) => {
        chatSetToolsEnabled("", value)
    })

    $: $ctx = $currentChat?.settings?.num_ctx || 8192
    $: $temp = $currentChat?.settings?.temperature ?? 0.6
    $: $thinking = $currentChat?.settings?.enable_thinking ?? true
    $: $toolsEnabled = $currentChat?.toolsEnabled ?? false

    function handleContextBlur(event: Event) {
        const value = parseInt((event.target as HTMLInputElement).value, 10)
        if (value < 1024) {
            $ctx = value * 1024
        }
    }
</script>

<div id="ChatInferenceSettings">
    <!-- {#key $currentChat} -->
    <div>
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <label
            for="context"
            class="clickable"
            title="Click to open advanced inference settings"
            on:click={() => ($advancedInferenceDialogOpen = true)}
            >CNTX&nbsp;<Receipt_long
                color="var(--color-accent-complement)"
                size="1.1em"
            /></label
        >
        <input
            name="context"
            type="number"
            min="1024"
            max="1048576"
            step="1024"
            bind:value={$ctx}
            on:blur={handleContextBlur}
        />
    </div>
    <div>
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <label
            for="temp"
            class="clickable"
            title="Click to open advanced inference settings"
            on:click={() => ($advancedInferenceDialogOpen = true)}
            >TEMP&nbsp;<Thermostat
                color="var(--color-accent-complement)"
                size="1.1em"
            /></label
        >
        <input
            name="temp"
            type="number"
            min="0"
            max="2"
            step="0.1"
            bind:value={$temp}
        />
    </div>
    <div>
        <label for="thinking"
            >THNK&nbsp;<Psychology
                color="var(--color-accent-complement)"
                size="1.1em"
            />
            <input name="thinking" type="checkbox" bind:checked={$thinking} />
        </label>
    </div>
    <div>
        <label for="tools"
            >TOOL&nbsp;<Build
                color="var(--color-accent-complement)"
                size="1.1em"
            />
            <input name="tools" type="checkbox" bind:checked={$toolsEnabled} />
        </label>
    </div>
    <!-- {/key} -->
</div>

<style lang="scss">
    #ChatInferenceSettings {
        display: flex;
        flex-direction: column;
        gap: 0.25em;
        padding-inline: 1em;
        height: 100%;
        place-content: top;

        div {
            flex: 0 0 auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
            align-items: center;
        }

        label {
            color: var(--color-accent);
            display: flex;
            text-transform: uppercase;
            font-weight: bold;

            &.clickable {
                cursor: pointer;
                &:hover {
                    color: var(--color-accent-complement);
                }
            }
        }

        input {
            font-family: monospace;
            background: var(--color-background-darkest);
            border: 0;
            padding: 0.25em;
            color: var(--color-accent-tertiary-lightest);
            display: inline;
            width: 6.4em;

            &:focus {
                color: var(--color-accent);
                outline: none;
            }
        }

        input[type="checkbox"] {
            width: auto;
            accent-color: var(--color-accent);
            cursor: pointer;
        }
    }
</style>
