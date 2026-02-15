<script lang="ts">
    import { Fast_rewind } from "svelte-google-materialdesign-icons"

    export let isAttachment: boolean = false
    export let line: string = ""
    export let index: number | undefined = undefined
    export let onRewind: ((index: number) => void) | undefined = undefined

    const MAX_LINE_LENGTH = 512

    function getTruncatedLine(): string {
        return (
            line.substr(0, MAX_LINE_LENGTH) +
            (line.length > MAX_LINE_LENGTH ? "&hellip;" : "")
        )
    }

    function handleRewindClick() {
        if (onRewind && index !== undefined) {
            onRewind(index)
        }
    }
</script>

{#if isAttachment}
    <div class="response user is-attachment" data-testid="ChatLogRegular_User">
        {line}
    </div>
{:else}
    <div class="response user" data-testid="ChatLogRegular_User">
        <div class="message-content">
            {@html getTruncatedLine()}
        </div>
        {#if onRewind && index !== undefined}
            <button
                class="rewind-btn"
                title="Rewind to this message"
                on:click={handleRewindClick}
            >
                <Fast_rewind size="16" />
            </button>
        {/if}
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
        font-size: 0.9em;
        max-width: 100%;
        position: relative;
        &::before {
            content: "> ";
            font-weight: bold;
        }

        &.user {
            display: flex;
            align-items: flex-start;
            gap: 0.5em;

            .message-content {
                flex: 1;
            }

            .rewind-btn {
                flex-shrink: 0;
                opacity: 0.5;
                transition: opacity 0.2s;
                background: none;
                border: none;
                cursor: pointer;
                font-size: 0.8em;
                padding: 0.25em;
                color: var(--color-accent);
                display: flex;
                align-items: center;
                justify-content: center;
                min-width: 1.5em;
                min-height: 1.5em;
            }
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

    .response:hover .rewind-btn {
        opacity: 1;
    }
</style>
