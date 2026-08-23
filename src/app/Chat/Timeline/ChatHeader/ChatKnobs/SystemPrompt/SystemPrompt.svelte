<script>
    import { appState } from "$lib/appState/appState"
    import {
        chatAddSubPrompt,
        chatRemoveSubPrompt,
        chatSetSystemPrompt,
        chatToggleSubPrompt,
        chatUpdateSubPromptText,
    } from "$lib/chatSession/chatActions"
    import { currentChat } from "$lib/chatSession/chatSession"
    import { recalculateUserVariables } from "$lib/templating/templating"
    import { onMount } from "svelte"
    import { Add, Delete } from "svelte-google-materialdesign-icons"
    import { derived, writable } from "svelte/store"
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
        <div class="subprompts-box">
            <h3>Sub-Prompts</h3>
            <p class="hint">
                Optional. Enabled sub-prompts fill &lcub;&lcub;N&rcub;&rcub;
                slots in the system prompt; any without a slot are appended
                in order.
            </p>
            {#if $currentChat && $currentChat.subPrompts.length}
                <div class="subprompt-grid">
                {#each $currentChat.subPrompts as sp, i (sp.id)}
                    <div class="subprompt-card">
                        <div class="subprompt-header">
                            <span class="subprompt-label">Sub-Prompt {i + 1}</span>
                            <label class="subprompt-toggle">
                                <input
                                    type="checkbox"
                                    checked={sp.enabled}
                                    onchange={(ev) =>
                                        chatToggleSubPrompt(
                                            $currentChat.id,
                                            sp.id,
                                            ev.target.checked
                                        )}
                                />
                                enabled
                            </label>
                            <button
                                class="subprompt-delete"
                                title="Delete sub-prompt"
                                onclick={() =>
                                    chatRemoveSubPrompt($currentChat.id, sp.id)}
                            >
                                <svelte:component this={Delete} size="20" />
                            </button>
                        </div>
                        <textarea
                            placeholder="Sub-prompt text..."
                            rows="4"
                            class="subprompt-textarea"
                            value={sp.text}
                            oninput={(ev) =>
                                chatUpdateSubPromptText(
                                    $currentChat.id,
                                    sp.id,
                                    ev.target.value
                                )}
                        ></textarea>
                    </div>
                {/each}
                </div>
            {:else}
                <p class="empty">No sub-prompts.</p>
            {/if}
        </div>
        <div class="modal-footer">
            <button
                class="btnAdd"
                onclick={() => chatAddSubPrompt($currentChat?.id)}
            >
                <svelte:component this={Add} size="20" /> Add Sub-Prompt
            </button>
            <button class="btnClose" onclick={() => (isOpen = false)}>
                Close
            </button>
        </div>
    </div>
{/if}

<style lang="scss">
    .btn-prompt {
        background-color: var(--color-accent-darkest);
        color: var(--color-accent-text);
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

        .subprompts-box {
            h3 {
                font-weight: bold;
                font-size: 1.25rem;
                margin: 0;
                margin-top: 0.5rem;
                padding: 0 1rem;
                color: var(--color-accent-complement);
            }

            .hint {
                margin: 0.25rem 1rem;
                font-size: 0.9em;
                color: var(--color-text-dim);
            }

            .subprompt-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.5rem;
                padding: 0 1rem;
            }

            .subprompt-card {
                margin: 0;
                padding: 0.5rem;
                background-color: var(--color-background-darker);
                border-radius: var(--border-radius-standard);

                .subprompt-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;

                    .subprompt-label {
                        font-weight: bold;
                        flex: 1;
                    }

                    .subprompt-toggle {
                        display: flex;
                        align-items: center;
                        gap: 0.25rem;
                        font-size: 0.9em;
                        color: var(--color-text-dim);
                    }

                    .subprompt-delete {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        padding: 0.25rem;
                        background: none;
                        border: none;
                        border-radius: var(--border-radius-standard);
                        color: var(--color-text-dim);
                        cursor: pointer;

                        &:hover {
                            color: var(--color-accent);
                        }
                    }
                }

                .subprompt-textarea {
                    height: auto;
                    min-height: 80px;
                    max-height: 200px;
                    font-size: 1em;
                    margin: 0;
                }
            }

            .empty {
                margin: 0.5rem 1rem;
                font-size: 0.9em;
                color: var(--color-text-dim);
            }
        }

        .modal-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 1rem 1rem;

            .btnAdd {
                display: inline-flex;
                align-items: center;
                gap: 0.25rem;
            }
        }
    }
</style>
