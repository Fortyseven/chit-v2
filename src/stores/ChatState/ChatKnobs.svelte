<script>

    import { Accordion, AccordionItem } from "@skeletonlabs/skeleton"
    import { currentConvo } from "../chatState.svelte"

        const advancedValues = [
        'mirostat',
        'mirostat_eta',
        'mirostat_tau',
        'repeat_last_n',
        'repeat_penalty',
        'tfs_z',
        'top_k',
        'top_p'
    ];

    function onBlurValue(key) {
        $currentConvo.chatState.knobs[key] = Number($currentConvo.chatState.knobs[key])
    }

    // let foo = $state($currentConvo.chatState.knobs)

    // $effect(() => {
    //     console.log(foo)
    // })
</script>
<div id="ChatKnobs">
    <div>
    <Accordion>
            <AccordionItem open>
                {#snippet summary()}
                    System Prompt
                {/snippet}

                {#snippet content()}
                <textarea
                    class="system-prompt"
                    name="prompt"
                    id="prompt"
                    placeholder="Write a message..."
                    rows="1"
                ></textarea>
                {/snippet}
            </AccordionItem>
    </Accordion>
    </div>
    <div>
    <Accordion >
            <AccordionItem open>
                {#snippet summary()}
                    Chat Settings
                {/snippet}

                {#snippet content()}
                    {#if $currentConvo.chatState.knobs}
                    <ul>
                    {Object.keys($currentConvo.chatState.knobs)}
                        {#each Object.keys($currentConvo.chatState.knobs).filter( (e) => advancedValues.includes(e) ) as key}
                            <li>
                                <label>{key}</label>
                                <input
                                    bind:value={$currentConvo.chatState.knobs[key]}
                                    on:blur={() => onBlurValue(key)}
                                />
                            </li>
                        {/each}
                    </ul>
                {/if}

                {/snippet}
            </AccordionItem>
    </Accordion>
    </div>
</div>

<style lang="scss">
    :global(#ChatKnobs) {
        display: flex;
        width: 100%;
        // max-width: 1024px;
        margin: auto;
        flex-wrap: wrap;

        > div {
            flex: 1 1 512px;

            .system-prompt {
                background-color: rgb(var(--color-surface-800));
                border-bottom: 1px solid rgb(var(--color-surface-400));
                border-radius: var(--theme-rounded-container);
                border-top: 1px solid rgb(var(--color-surface-800));
                border: none;
                color: var(--primary-fg);
                flex: auto;
                font-family: inherit;
                font-size: 1.2em;
                outline-style: none;
                padding: 0.5em;
                width: 100%;

                &:disabled {
                    opacity: 0.5;
                }

                &.overflow {
                    color: #f44;
                }

                &::placeholder {
                    color: rgb(var(--color-surface-500));
                }
            }
        }
    }
</style>