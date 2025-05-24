<script>
    import { onMount } from "svelte"
    import { derived, writable } from "svelte/store"
    import { appState } from "../../../../lib/appState/appState"
    import { chatSetSystemPrompt } from "../../../../lib/chatSession/chatActions"
    import { currentChat } from "../../../../lib/chatSession/chatSession"
    import { recalculateUserVariables } from "../../../../lib/templating/templating"
    import Variables from "./Variables.svelte"

    let sys_prompt_state = writable($currentChat.systemPrompt)

    sys_prompt_state.subscribe((value) => {
        chatSetSystemPrompt($appState.activeChatId, value)
    })

    currentChat.subscribe((value) => {
        if ($currentChat) {
            sys_prompt_state.set($currentChat.systemPrompt)
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
    let hasVariables = false

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

    $: if ($currentChat && $currentChat.templateVariables) {
        hasVariables = Object.keys($currentChat.templateVariables).length
    }

    $: if ($currentChat.systemPrompt) {
        recalculateUserVariables($currentChat.id)
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
        id="spromptModal"
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
        {#if hasVariables}
            <Variables />
        {/if}
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

    #spromptModal {
        background-color: var(--color-background);
        color: var(--color-text);
        border-radius: var(--border-radius-standard);
        box-shadow: 0 0 1rem #000;
        position: relative;

        width: 40vw;
        height: auto;
        min-width: 450px;
        // margin-bottom: 1em;

        h2 {
            font-weight: bold;
            font-size: 1.5rem;
            padding: 0;
            margin: 0;
            margin-top: 1rem;
            color: var(--color-accent);
        }

        textarea {
            width: stretch;
            height: 100%;
            // min-width: 400px;
            max-width: stretch;
            min-height: 200px;
            max-height: 400px;
            border-radius: var(--border-radius-standard);
            margin: 1rem;
            background-color: var(--color-background-darker);
            color: var(--color-accent);
            border: none;
            font-family: --font-ui;
            padding: 1rem;
            font-size: 1.25em;
        }

        .btnClose {
            margin-bottom: 1rem;
        }
    }
</style>
