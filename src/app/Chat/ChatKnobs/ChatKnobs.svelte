<script>
    import { currentChat } from "../../../chatSession/chatSession"
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

    // function onBlurValue(key) {
    //     $currentChat.conversation.knobs[key] = Number(
    //         $currentChat.conversation.knobs[key],
    //     )
    // }

    // let foo = $state($currentChat.chatState.knobs)

    // $effect(() => {
    //     console.log(foo)
    // })

    // $inspect(llm.models)
</script>

<div id="ChatKnobs" class="flex flex-wrap h-full">
    <div
        class="flex flex-wrap gap-2 px-2 py-2 w-full place-content-start flex-col md:flex-row"
    >
        <SystemPrompt></SystemPrompt>
        <ModelSelect></ModelSelect>
    </div>
</div>

<style lang="scss">
</style>
