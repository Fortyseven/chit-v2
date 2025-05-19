<script lang="ts">
    export let isAttachment: boolean = false
    export let line: string = ""

    const MAX_LINE_LENGTH = 512

    function getTruncatedLine(): string {
        return (
            line.substr(0, MAX_LINE_LENGTH) +
            (line.length > MAX_LINE_LENGTH ? "&hellip;" : "")
        )
    }
</script>

{#if isAttachment}
    <div class="response user is-attachment">
        {line}
    </div>
{:else}
    <div class="response user">
        {@html getTruncatedLine()}
    </div>
{/if}

<style lang="scss">
    .response {
        width: auto;
        padding-block: 1em;
        padding-inline: 0.6em;
        padding-block-start: 2em;
        color: var(--color-neutral);
        font-style: italic;
        font-size: 1.15em;
        &::before {
            content: "> ";
            font-weight: bold;
        }

        &.is-attachment {
            font-family: monospace;
            color: var(--color-accent-complement);
            font-size: 0.8em;
            max-height: 8em;
            margin-block-end: 1em;
            white-space: pre-wrap;
            overflow: scroll;
            &::before {
                content: "";
            }
            width: fit-content !important;
            background-color: #3339;
            padding: 1.5em !important;
            font-style: unset;
            line-height: 1;
            border-radius: var(--border-radius-standard);
            text-shadow: 0 0 10px var(--color-accent-complement-lighter);
            box-shadow: 0 0 10px black;
            cursor: text;
        }
    }
</style>
