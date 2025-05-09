<script>
    import { onMount } from "svelte"
    import { derived, writable } from "svelte/store"
    import { appState } from "../../../lib/appState/appState"
    import { chatSetSystemPrompt } from "../../../lib/chatSession/chatActions"
    import { currentChat } from "../../../lib/chatSession/chatSession"

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

    let isOpen = false

    const shortPrompt = derived(sys_prompt_state, ($sys_prompt_state) => {
        if (!$sys_prompt_state) return "No SPrompt"

        return $sys_prompt_state.length > PREVIEW_CUTOFF_LENGTH
            ? $sys_prompt_state.slice(0, PREVIEW_CUTOFF_LENGTH) + "..."
            : $sys_prompt_state
    })

    let buttonEl
    let dialog = null
    let textAreaEl

    let dialogPosition = {
        top: 0,
        left: 0,
    }

    function recalculateModal() {
        if (!isOpen) return

        if (buttonEl) {
            const btn = buttonEl.getBoundingClientRect()

            dialogPosition.top = btn.top + btn.height
            dialogPosition.left = window.innerWidth / 2 - dialog?.innerWidth / 2
        }
    }

    function toggleModal() {
        isOpen = !isOpen
        recalculateModal()
    }

    onMount(() => {
        window.addEventListener("resize", recalculateModal)

        window.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && isOpen) {
                isOpen = false
            }
        })
    })

    $: if (isOpen && textAreaEl) {
        textAreaEl.focus()
        textAreaEl.setSelectionRange(0, 0)
    }
</script>

<button
    tabindex="0"
    class="btn-prompt"
    bind:this={buttonEl}
    onclick={toggleModal}
>
    {$shortPrompt || "No SPrompt"}
</button>

{#if isOpen}
    <div
        id="sprompt_modal"
        class="modal"
        style="position: absolute; left: {dialogPosition.left}px; top: {dialogPosition.top}px; z-index: 1000;"
        bind:this={dialog}
    >
        <div class="modal-box">
            <h2>System Prompt</h2>
            <textarea
                id="prompt"
                name="prompt"
                placeholder="Write a system prompt..."
                rows="10"
                bind:value={$sys_prompt_state}
                bind:this={textAreaEl}
            ></textarea>
        </div>
        <button class="btnClose" onclick={() => (isOpen = false)}>
            Close
        </button>
    </div>
{/if}

<style lang="scss">
    .btn-prompt {
        background-color: var(--color-accent-darker2);
        color: var(--color-text);
    }

    #sprompt_modal {
        background-color: var(--color-background);
        color: var(--color-text);
        border-radius: var(--border-radius-standard);
        box-shadow: 0 0 1em #000;

        width: auto;
        height: auto;
        margin-bottom: 1em;

        h2 {
            font-weight: bold;
            font-size: 1.5rem;
            padding: 0;
            margin: 0;
            margin-top: 1em;
            color: var(--color-accent);
        }

        textarea {
            width: auto;
            height: 100%;
            min-width: 400px;
            max-width: 800px;
            min-height: 200px;
            max-height: 400px;
            border-radius: var(--border-radius-standard);
            margin: 1em;
            background-color: var(--color-background-darker);
            color: var(--color-accent);
            border: none;
            font-family: --font-ui;
            padding: 1em;
            font-size: 1.25em;
        }

        .btnClose {
            margin-bottom: 1em;
        }
    }
</style>
