<script>
    import { derived, writable } from "svelte/store"
    import { appState } from "../../../appState/appState"
    import { chatSetSystemPrompt } from "../../../chatSession/chatActions"
    import { currentChat } from "../../../chatSession/chatSession"

    let sys_prompt_state = writable($currentChat.system_prompt)

    sys_prompt_state.subscribe((value) => {
        chatSetSystemPrompt($appState.activeChatId, value)
    })

    currentChat.subscribe((value) => {
        if ($currentChat) {
            sys_prompt_state.set($currentChat.system_prompt)
        }
    })

    const PREVIEW_CUTOFF_LENGTH = 50

    const shortPrompt = derived(sys_prompt_state, ($sys_prompt_state) => {
        return $sys_prompt_state.length > PREVIEW_CUTOFF_LENGTH
            ? $sys_prompt_state.slice(0, PREVIEW_CUTOFF_LENGTH) + "..."
            : $sys_prompt_state
    })
</script>

<button tabindex="0" class="btn m-1" onclick={sprompt.showModal()}>
    {$shortPrompt || "No SPrompt"}
</button>

<dialog id="sprompt" class="modal">
    <div class="modal-box">
        <h2 class="font-bold text-xl pb-4">System Prompt</h2>
        <textarea
            id="prompt"
            name="prompt"
            class="w-full"
            placeholder="Write a system prompt..."
            rows="10"
            bind:value={$sys_prompt_state}
        ></textarea>
        <div class="modal-action">
            <form method="dialog">
                <button class="btn btn-primary">Close</button>
            </form>
        </div>
    </div>
</dialog>
