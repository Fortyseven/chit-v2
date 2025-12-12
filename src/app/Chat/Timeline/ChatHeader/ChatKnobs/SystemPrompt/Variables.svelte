<script lang="ts">
    import { currentChat } from "$lib/chatSession/chatSession"
    import { chatUpdateTemplateVariableValue } from "$lib/templating/templating"

    /* if this is rendered, it means we can has variables */

    function onKeyChange(key: string, ev: Event) {
        const input = ev.target as HTMLInputElement
        chatUpdateTemplateVariableValue($currentChat?.id, key, input.value)
    }
</script>

{#if $currentChat && $currentChat.templateVariables}
    <div class="variables">
        <div class="entries">
            {#each Object.entries($currentChat.templateVariables) as [key, value]}
                <div class="entry">
                    <input type="text" bind:value={key} disabled />
                    <input
                        type="text"
                        {value}
                        onchange={(ev) => onKeyChange(key, ev)}
                    />
                </div>
            {/each}
        </div>
    </div>
{/if}

<style lang="scss">
    .variables {
        padding-block: 1rem;
        background-color: var(--color-background-lighter);
        border-radius: var(--border-radius-standard);
        margin-inline: 1rem;
        margin-block: 1rem;

        .entries {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            margin-inline: 1rem;

            .entry {
                display: grid;
                grid-template-columns: auto auto;
                width: 100%;
                gap: 0.25rem;
                margin: auto;
                input {
                    background-color: #0008;
                    box-sizing: border-box;
                    color: var(--color-accent-complement);
                    font-size: 1.1em;
                    border: none;
                    width: 100%;
                    padding: 0.25rem 0.5rem;
                    font-family: monospace;
                    border-radius: var(--border-radius-standard);
                    border-top-right-radius: 0;
                    border-bottom-right-radius: 0;
                }
                input:last-of-type {
                    color: var(--color-text);
                    border-top-right-radius: var(--border-radius-standard);
                    border-bottom-right-radius: var(--border-radius-standard);

                    border-top-left-radius: 0;
                    border-bottom-left-radius: 0;
                }
            }
        }
    }
</style>
