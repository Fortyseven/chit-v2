<script lang="ts">
    import { writable } from "svelte/store"
    import { chatUpdateSettings } from "../../../lib/chatSession/chatActions"
    import { currentChat } from "../../../lib/chatSession/chatSession"

    let ctx = writable($currentChat?.settings?.num_ctx || 8192)
    let temp = writable($currentChat?.settings?.temperature || 0.6)

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
    $: $temp = $currentChat?.settings?.temperature || 0.6

    function handleContextBlur(event) {
        const value = parseInt(event.target.value);
        if (value < 1024) {
            $ctx = value * 1024;
        }
    }
</script>

<div id="ChatInfSettings">
    <!-- {#key $currentChat} -->
    <div>
        <label for="context">Cntx 📜</label>
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
        <label for="temp">Temp 🌡</label>
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
    #ChatInfSettings {
        display: flex;
        flex-direction: column;
        gap: 0.25em;
        padding-inline: 1em;
        height: 100%;
        div {
            flex: 0 0 auto;
            display: grid;
            grid-template-columns: 4.5em 1fr;
        }

        label {
            color: var(--color-accent);
            display: flex;
            text-transform: uppercase;
            line-height: 2;
            font-weight: bold;
        }

        input {
            font-family: monospace;
            background: var(--color-background-darker);
            border: 0;
            padding: 0.25em;
            color: var(--color-accent-complement);
            display: inline;
            width: 6.4em;

            &:focus {
                color: var(--color-primary-400);
                outline: none;
            }
        }
    }
</style>
