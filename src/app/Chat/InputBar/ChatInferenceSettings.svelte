<script lang="ts">
    import { chatUpdateSettings } from "$lib/chatSession/chatActions"
    import { currentChat } from "$lib/chatSession/chatSession"
    import { Receipt_long, Thermostat } from "svelte-google-materialdesign-icons"
    import { writable } from "svelte/store"

    let ctx   = writable($currentChat?.settings?.num_ctx || 8192)
    let temp  = writable($currentChat?.settings?.temperature || 0.6)

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

    $: $ctx = $currentChat?.settings?.num_ctx || 8192
    $: $temp = $currentChat?.settings?.temperature

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
        <label for="context">CNTX&nbsp;<Receipt_long color="var(--color-accent-complement)" size="1.1em" /></label>
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
        <label for="temp">TEMP&nbsp;<Thermostat color="var(--color-accent-complement)" size="1.1em" /></label>
        <input
            name="temp"
            type="number"
            min="0"
            max="2"
            step="0.1"
            bind:value={$temp}
        />
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
    }
</style>
