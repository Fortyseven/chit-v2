<script lang="ts">
    import { currentChat } from "../../../lib/chatSession/chatSession"

    export let inputLength = 0
    export let systemPromptLength = 0

    $: contextLimit = $currentChat?.settings?.num_ctx || 0
    $: overflow = inputLength + systemPromptLength >= contextLimit
    $: totalLength = inputLength + systemPromptLength

    console.log({ inputLength, systemPromptLength })
</script>

<div class="status-bar">
    <span title="User tokens">
        {inputLength}
    </span>
    +
    <span title="System prompt tokens">
        {systemPromptLength}
    </span>
    <span>=</span>
    <span class:overflow title="Combined tokens">
        {totalLength}
    </span>
</div>

<style lang="scss">
    .status-bar {
        // background: black;
        color: var(--color-accent);
        text-align: center;
        margin-top: 0.6em;
        font-family: monospace;
        text-transform: uppercase;
        letter-spacing: -1px;

        .overflow {
            color: #f00;
            font-weight: bold;
        }
    }
</style>
