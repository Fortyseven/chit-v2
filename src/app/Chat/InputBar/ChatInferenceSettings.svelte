<script lang="ts">
    import { writable } from "svelte/store"
    import { chatUpdateSettings } from "../../../lib/chatSession/chatActions"
    import { currentChat } from "../../../lib/chatSession/chatSession"

    let ctx = writable($currentChat?.settings?.num_ctx || 2048)
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
</script>

<div id="ChatInfSettings">
    <!-- {#key $currentChat} -->
        <div>
            <label for="context">Cntx:</label>
            <input
                name="context"
                type="number"
                min="1024"
                max="1048576"
                step="1024"
                bind:value={$ctx}
            />
        </div>
        <div>
            <label for="temp">Temp:</label>
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
        div {
            flex: auto;
            display: grid;
            grid-template-columns: 3em 1fr;
        }
        label {
            color: var(--color-primary-500);
            display: inline-block;
            place-content: center;
        }
        input {
            background: transparent;
            color: var(--color-secondary-500);
            font-family: monospace;
            &:focus {
                color: var(--color-primary-400);
                outline: none;
            }
        }
    }
</style>
