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
    import { writable } from "svelte/store"
    import { chatSetSystemPrompt } from "../../../chatSession/chatActions"
    import { activeChatId, currentChat } from "../../../chatSession/chatSession"

    storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow })

    const popupSystemPrompt = {
        // Represents the type of event that opens/closed the popup
        event: "click",
        // Matches the data-popup value on your popup element
        target: "popupSystemPrompt",
        // Defines which side of your trigger the popup will appear
        placement: "bottom",
    }

    let sys_prompt_state = writable($currentChat.system_prompt)

    sys_prompt_state.subscribe((value) => {
        console.log("sys_prompt_state", value)
        chatSetSystemPrompt($activeChatId, value)
    })

    currentChat.subscribe((value) => {
        sys_prompt_state.set($currentChat.system_prompt)
    })
</script>

<div class="flex">
    <button
        class="variant-ghost-primary [&>*]:pointer-events-none text-ellipsis text-nowrap overflow-hidden h-11 w-full sm:max-w-xs"
        use:popup={popupSystemPrompt}
    >
        {$sys_prompt_state || "System Prompt"}
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
            bind:value={$sys_prompt_state}
        ></textarea>
    </div>
</div>
