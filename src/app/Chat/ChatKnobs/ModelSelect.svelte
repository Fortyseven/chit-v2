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

    const popupModelSelect = {
        // Represents the type of event that opens/closed the popup
        event: "click",
        // Matches the data-popup value on your popup element
        target: "popupModelSelect",
        // Defines which side of your trigger the popup will appear
        placement: "bottom",
    }
</script>

<div class="">
    <button
        class=" variant-ghost-secondary [&>*]:pointer-events-none whitespace-nowrap !text-ellipsis overflow-hidden w-[150px]"
        use:popup={popupModelSelect}
        >{chat_state.model || "Select Model"}</button
    >
    <div
        class="card w-full shadow-2xl flex flex-wrap sm:flex-nowrap gap-4 hidden"
        data-popup="popupModelSelect"
    >
        <div class="arrow">|</div>
        <select
            bind:value={chat_state.model}
            name="system"
            id="system"
            class="flex-auto w-full p-4"
        >
            {#each llm.models as { model, name }}
                <option value={model}>{name}</option>
            {/each}
        </select>
        <button class="btn flex-auto">Refresh</button>
    </div>
</div>
