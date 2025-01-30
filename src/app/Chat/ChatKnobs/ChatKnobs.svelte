<script>
    import { Accordion, AccordionItem } from "@skeletonlabs/skeleton"

    import { currentChatSession } from "../../../stores/chatSessions.svelte"
    import ModelSelect from "./ModelSelect.svelte"
    import SystemPrompt from "./SystemPrompt.svelte"

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
        $currentChatSession.conversation.knobs[key] = Number(
            $currentChatSession.conversation.knobs[key],
        )
    }

    // let foo = $state($currentChatSession.chatState.knobs)

    // $effect(() => {
    //     console.log(foo)
    // })

    // $inspect(llm.models)

    let chat_state = $currentChatSession.conversation
</script>

<div id="ChatKnobs" class="flex flex-wrap h-full">
    <!-- <Accordion>
        <AccordionItem open> -->
    <!-- {#snippet summary()}
        Chat Settings
    {/snippet} -->

    <!-- {#snippet content()} -->
    <div class="flex flex-wrap gap-1 h-24 w-full place-content-start">
        <SystemPrompt></SystemPrompt>
        <ModelSelect></ModelSelect>
    </div>
    <div>
        {#if $currentChatSession.conversation.knobs}
            <ul>
                {Object.keys($currentChatSession.conversation.knobs)}
                {#each Object.keys($currentChatSession.conversation.knobs).filter( (e) => advancedValues.includes(e), ) as key}
                    <li>
                        <label>{key}</label>
                        <input
                            bind:value={$currentChatSession.conversation.knobs[
                                key
                            ]}
                            on:blur={() => onBlurValue(key)}
                        />
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
    <!-- {/snippet} -->
    <!-- </AccordionItem>
    </Accordion> -->
</div>

<style lang="scss">
    // :global(#ChatKnobs) {
    //     display: flex;
    //     width: 100%;
    //     // max-width: 1024px;
    //     margin: auto;
    //     flex-wrap: wrap;
    //     background: rgb(var(--color-surface-800));

    //     .left-system {
    //         padding: 1em 0.25em !important;
    //         width: 100%;

    //         textarea {
    //             padding: 0.5em;
    //         }
    //     }

    //     > div {
    //         box-shadow: 0px 0px 10px #0006 !important;
    //         z-index: 10;
    //         flex: 1 1 512px;
    //         padding: 1em;
    //         width: 100%;

    //         .system-prompt {
    //             background-color: rgb(var(--color-surface-900));
    //             color: rgb(var(--color-primary-500));
    //             border-bottom: 1px solid rgb(var(--color-surface-400));
    //             border-radius: var(--theme-rounded-container);
    //             border-top: 1px solid rgb(var(--color-surface-800));
    //             // border: none;
    //             flex: auto;
    //             font-family: inherit;
    //             font-size: 1em;
    //             outline-style: none;
    //             width: 100%;

    //             textarea {
    //                 border: 1px solid green !important;
    //                 padding: 0.5em !important;
    //                 margin: 0 !important;
    //             }
    //             &:disabled {
    //                 opacity: 0.5;
    //             }

    //             &.overflow {
    //                 color: #f44;
    //             }

    //             &::placeholder {
    //                 color: rgb(var(--color-surface-500));
    //             }
    //         }
    //     }
    // }
</style>
