<script>
    // @ts-nocheck

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
    import { currentChatSession } from "../../../stores/chatSessions.svelte"
    storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow })

    // let chat_state = $state($currentChatSession.conversation)
    let chat_state = $currentChatSession.conversation

    const popupSystemPrompt = {
        // Represents the type of event that opens/closed the popup
        event: "click",
        // Matches the data-popup value on your popup element
        target: "popupSystemPrompt",
        // Defines which side of your trigger the popup will appear
        placement: "bottom",
    }

    // let sys_prompt =
</script>

<div class="flex md:px-4">
    <button
        class="variant-ghost-primary [&>*]:pointer-events-none text-ellipsis text-nowrap overflow-hidden h-11 w-full max-w-xs"
        use:popup={popupSystemPrompt}
    >
        {$currentChatSession.conversation.system_prompt || "System Prompt"}
    </button>
    <div
        class="card w-full shadow-2xl flex flex-wrap sm:flex-nowrap gap-4 hidden"
        data-popup="popupSystemPrompt"
    >
        <div class="arrow">&uparrow;</div>
        <textarea
            class="system-prompt w-full p-2"
            name="prompt"
            id="prompt"
            placeholder="Write a system prompt..."
            rows="10"
            bind:value={$currentChatSession.conversation.system_prompt}
        ></textarea>
    </div>
</div>
