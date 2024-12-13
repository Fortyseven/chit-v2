<script>
    import {
        arrow,
        autoUpdate,
        computePosition,
        flip,
        offset,
        shift,
    } from "@floating-ui/dom"
    import { popup, storePopup } from "@skeletonlabs/skeleton"

    import llm from "../../../lib/llm/ollama.svelte"
    import { currentConvo } from "../../../stores/chatState.svelte"
    storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow })

    let chat_state = $state($currentConvo.chatState)

    const popupSystemPrompt = {
        // Represents the type of event that opens/closed the popup
        event: "click",
        // Matches the data-popup value on your popup element
        target: "popupSystemPrompt",
        // Defines which side of your trigger the popup will appear
        placement: "bottom",
    }

    let sys_prompt = $state($currentConvo.chatState.system_prompt)
</script>

<div>
    <button
        class="variant-ghost-primary [&>*]:pointer-events-none text-ellipsis overflow-hidden w-[150px] h-11"
        use:popup={popupSystemPrompt}>{sys_prompt || "System Prompt"}</button
    >
    <div
        class="card w-full shadow-2xl flex flex-wrap sm:flex-nowrap gap-4 hidden"
        data-popup="popupSystemPrompt"
    >
        <div class="arrow">|</div>
        <textarea
            class="system-prompt w-full p-2"
            name="prompt"
            id="prompt"
            placeholder="Write a system prompt..."
            rows="10"
            bind:value={sys_prompt}
        ></textarea>
    </div>
</div>
