<script lang="ts">
    import { advancedInferenceDialogOpen } from "$lib/appState/advancedInferenceDialogState"
    import {
        chatSetToolsEnabled,
        chatUpdateSettings,
    } from "$lib/chatSession/chatActions"
    import { currentChat, type ReasoningEffort } from "$lib/chatSession/chatSession"
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
    let reasoningEffort = writable<ReasoningEffort>(
        $currentChat?.settings?.reasoning_effort ?? "medium",
    )
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

    reasoningEffort.subscribe((value) => {
        chatUpdateSettings("", {
            reasoning_effort: value,
        })
    })

    toolsEnabled.subscribe((value) => {
        chatSetToolsEnabled("", value)
    })

    $: $ctx = $currentChat?.settings?.num_ctx || 8192
    $: $temp = $currentChat?.settings?.temperature ?? 0.6
    $: $thinking = $currentChat?.settings?.enable_thinking ?? true
    $: $reasoningEffort = $currentChat?.settings?.reasoning_effort ?? "medium"
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
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <label
        for="context"
        class="label clickable"
        title="Click to open advanced inference settings"
        on:click={() => ($advancedInferenceDialogOpen = true)}
        >CNTX</label
    >
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <label
        for="context"
        class="label icon clickable"
        title="Click to open advanced inference settings"
        on:click={() => ($advancedInferenceDialogOpen = true)}
    >
        <Receipt_long
            color="var(--color-accent-complement)"
            size="1.1em"
        />
    </label>
    <input
        id="context"
        name="context"
        type="number"
        min="1024"
        max="1048576"
        step="1024"
        bind:value={$ctx}
        on:blur={handleContextBlur}
    />

    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <label
        for="temp"
        class="label clickable"
        title="Click to open advanced inference settings"
        on:click={() => ($advancedInferenceDialogOpen = true)}
        >TEMP</label
    >
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <label
        for="temp"
        class="label icon clickable"
        title="Click to open advanced inference settings"
        on:click={() => ($advancedInferenceDialogOpen = true)}
    >
        <Thermostat
            color="var(--color-accent-complement)"
            size="1.1em"
        />
    </label>
    <input
        id="temp"
        name="temp"
        type="number"
        min="0"
        max="2"
        step="0.1"
        bind:value={$temp}
    />

    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <label
        for="thinking"
        class="label clickable"
        title="Click to open advanced inference settings"
        on:click={(e) => {
            e.preventDefault()
            e.stopPropagation()
            $advancedInferenceDialogOpen = true
        }}
        >THNK</label
    >
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <label
        for="thinking"
        class="label icon clickable"
        title="Click to open advanced inference settings"
        on:click={(e) => {
            e.preventDefault()
            e.stopPropagation()
            $advancedInferenceDialogOpen = true
        }}
    >
        <Psychology
            color="var(--color-accent-complement)"
            size="1.1em"
        />
    </label>
    <div class="controls">
        <input
            id="thinking"
            name="thinking"
            type="checkbox"
            bind:checked={$thinking}
        />
        <select
            name="reasoning-effort"
            bind:value={$reasoningEffort}
            disabled={!$thinking}
            title="Reasoning effort (requires THNK)"
        >
            <option value="none">none</option>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="xhigh">xhigh</option>
        </select>
    </div>

    <label for="tools" class="label">TOOL</label>
    <label for="tools" class="label icon">
        <Build
            color="var(--color-accent-complement)"
            size="1.1em"
        />
    </label>
    <div class="controls">
        <input
            id="tools"
            name="tools"
            type="checkbox"
            bind:checked={$toolsEnabled}
        />
    </div>
    <!-- {/key} -->
</div>

<style lang="scss">
    #ChatInferenceSettings {
        display: grid;
        grid-template-columns: max-content max-content 1fr;
        gap: 0.25em 0.5rem;
        align-items: center;
        align-content: start;
        padding-inline: 1em;
        height: 100%;

        label {
            color: var(--color-accent);
            display: flex;
            align-items: center;
            text-transform: uppercase;
            font-weight: bold;
        }

        .icon {
            justify-content: center;
        }

        .clickable {
            cursor: pointer;
            &:hover {
                color: var(--color-accent-complement);
            }
        }

        .controls {
            display: flex;
            align-items: center;
            gap: 0.5em;
            min-width: 0;
        }

        input {
            font-family: monospace;
            background: var(--color-background-darkest);
            border: 0;
            padding: 0.25em;
            color: var(--color-accent-tertiary-lightest);
            width: 100%;
            box-sizing: border-box;

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

        select {
            font-family: monospace;
            background: var(--color-background-darkest);
            border: 0;
            padding: 0.25em;
            color: var(--color-accent-tertiary-lightest);
            width: auto;
            max-width: 100%;
            cursor: pointer;

            &:focus {
                color: var(--color-accent);
                outline: none;
            }

            &:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }
        }
    }
</style>
