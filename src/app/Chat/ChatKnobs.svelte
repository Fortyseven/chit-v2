<script>
    import { Accordion, AccordionItem } from "@skeletonlabs/skeleton"
    import llm from "../../lib/llm/ollama.svelte"
    import { currentConvo } from "../../stores/chatState.svelte"

    const advancedValues = [
        "mirostat",
        "mirostat_eta",
        "mirostat_tau",
        "repeat_last_n",
        "repeat_penalty",
        "tfs_z",
        "top_k",
        "top_p",
    ]

    function onBlurValue(key) {
        $currentConvo.chatState.knobs[key] = Number(
            $currentConvo.chatState.knobs[key],
        )
    }

    // let foo = $state($currentConvo.chatState.knobs)

    // $effect(() => {
    //     console.log(foo)
    // })

    $inspect(llm.models)

    let chat_state = $state($currentConvo.chatState)
</script>

<div id="ChatKnobs" class="sticky top-0 z-50">
    <div class="left-system">
        <Accordion>
            <AccordionItem open>
                {#snippet summary()}
                    Chat Settings
                {/snippet}

                {#snippet content()}
                    <div>
                        <select
                            bind:value={chat_state.model}
                            name="system"
                            id="system"
                        >
                            {#each llm.models as { model, name }}
                                <option value={model}>{name}</option>
                            {/each}
                        </select>
                    </div>
                    <div>
                        <label for="prompt">System Prompt</label>
                        <textarea
                            class="system-prompt"
                            name="prompt"
                            id="prompt"
                            placeholder="Write a system prompt..."
                            rows="10"
                            bind:value={$currentConvo.chatState.system_prompt}
                        ></textarea>
                    </div>
                    <div>
                        {#if $currentConvo.chatState.knobs}
                            <ul>
                                {Object.keys($currentConvo.chatState.knobs)}
                                {#each Object.keys($currentConvo.chatState.knobs).filter( (e) => advancedValues.includes(e), ) as key}
                                    <li>
                                        <label>{key}</label>
                                        <input
                                            bind:value={$currentConvo.chatState
                                                .knobs[key]}
                                            on:blur={() => onBlurValue(key)}
                                        />
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
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
        background: rgb(var(--color-surface-800));

        .left-system {
            padding: 1em 0.25em !important;
            width: 100%;

            textarea {
                padding: 0.5em;
            }
        }

        > div {
            box-shadow: 0px 0px 10px #0006 !important;
            z-index: 10;
            flex: 1 1 512px;
            padding: 1em;
            width: 100%;

            .system-prompt {
                background-color: rgb(var(--color-surface-900));
                color: rgb(var(--color-primary-500));
                border-bottom: 1px solid rgb(var(--color-surface-400));
                border-radius: var(--theme-rounded-container);
                border-top: 1px solid rgb(var(--color-surface-800));
                // border: none;
                flex: auto;
                font-family: inherit;
                font-size: 1em;
                outline-style: none;
                width: 100%;

                textarea {
                    border: 1px solid green !important;
                    padding: 0.5em !important;
                    margin: 0 !important;
                }
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
