<script lang="ts">
    import { derived } from "svelte/store"
    import { appActiveChat, appState } from "../../../appState/appState"
    import {
        chatAbort,
        chatAddRoleMessage,
        chatBack,
        chatChopLatest,
        chatInProgress,
        chatLength,
        chatRunInference,
    } from "../../../chatSession/chatActions"
    import { chats } from "../../../chatSession/chatSession"

    let inputBoxEl: HTMLTextAreaElement | undefined = undefined

    $: if (inputBoxEl) {
        inputBoxEl.focus()
    }

    /* ------------------------------------------------------ */
    chatInProgress.subscribe((value) => {
        console.log("chatInProgress", value)
        if (inputBoxEl && value == false) {
            setTimeout(() => {
                inputBoxEl?.focus()
            }, 100)
        }
    })

    /* ------------------------------------------------------ */
    async function _submitUserMessage(user_message: String | undefined) {
        if (!inputBoxEl || !$appState.activeChatId) {
            throw new Error("inputBoxEl is not defined or some such")
        }

        if (!user_message) {
            chatAddRoleMessage("", "user", "")
            chatRunInference()
            return
        }

        let presubmit_message = inputBoxEl.value

        try {
            inputBoxEl.value = ""
            inputBoxEl.disabled = true
            let message = user_message //|| inputBoxEl.value
            console.log("submit_user_message", message)

            if (message.trim() === "") {
                return
            }

            chatAddRoleMessage("", "user", message)

            chatRunInference()
        } catch (e) {
            // restore the message if it fails
            inputBoxEl.value = presubmit_message
            console.error(e)
        } finally {
            inputBoxEl.disabled = false
            inputBoxEl.focus()
        }
    }

    /* ------------------------------------------------------ */
    async function onInputKeypress(ev: KeyboardEvent) {
        if (ev.key === "Enter") {
            if (!ev.shiftKey) {
                ev.preventDefault()
                await _submitUserMessage(ev.target.value)
            }
        }
    }

    /* ------------------------------------------------------ */
    async function onGlobalKeypress(ev: KeyboardEvent) {
        if (ev.key === "e" && ev.ctrlKey) {
            ev.preventDefault()
            onBtnReroll()
        }

        if (ev.key === "b" && ev.ctrlKey) {
            ev.preventDefault()
            onBtnBack()
        }

        if (ev.key == "Escape") {
            ev.preventDefault()
            chatAbort()
        }

        // if (inputBoxEl) {
        //     inputBoxEl.focus()
        // }
    }

    /* ------------------------------------------------------ */
    function onBtnReroll() {
        chatChopLatest()
        chatRunInference()
    }

    /* ------------------------------------------------------ */
    function onBtnBack() {
        let usermsg = chatBack()

        if (inputBoxEl && usermsg) {
            inputBoxEl.value = usermsg as string
        }
    }

    /* ------------------------------------------------------ */
    const hasMessages = derived(
        [chats, appActiveChat],
        ([$chats, $appActiveChat]) => {
            return chatLength() > 0
        },
    )
</script>

<svelte:window on:keypress={onGlobalKeypress} />

{#key $appActiveChat}
    <div id="InputBox">
        <div class="flex flex-row gap-2 p-4 max-w-[800px] m-auto">
            <div class="flex flex-auto basis-[50%] disabled:opacity-50">
                <textarea
                    name="prompt"
                    id="prompt"
                    class="bg-black"
                    placeholder="Write a message..."
                    rows="1"
                    bind:this={inputBoxEl}
                    onkeypress={onInputKeypress}
                    disabled={$chatInProgress}
                ></textarea>
            </div>
            <div class="flex flex-row flex-auto gap-1 flex-grow-0">
                <button
                    class="variant-filled-primary flex-auto text-center w-auto h-full disabled:opacity-50"
                    onclick={() => _submitUserMessage(inputBoxEl?.value)}
                    disabled={$chatInProgress}>Send</button
                >
                {#key $hasMessages}
                    <div class="flex flex-col flex-auto gap-1">
                        <button
                            class="variant-filled-primary w-full p-1 flex-auto disabled:opacity-50"
                            onclick={onBtnReroll}
                            disabled={!$hasMessages || $chatInProgress}
                        >
                            Reroll
                        </button>
                        <button
                            class="variant-filled-primary w-full p-1 flex-auto disabled:opacity-50"
                            onclick={onBtnBack}
                            disabled={!$hasMessages || $chatInProgress}
                        >
                            Back
                        </button>
                    </div>
                {/key}
            </div>
        </div>
    </div>
{/key}

<style lang="scss">
    #InputBox {
        border-radius: var(--theme-rounded-container);
        background: #fb01;
        backdrop-filter: blur(15px);
        filter: drop-shadow(0 0 2em #000);

        textarea {
            border-radius: var(--theme-rounded-container);
            font-size: 1.2em;
            outline-style: none;
            width: 100%;
            height: 100%;
            padding: 0.5em;
            border-top: 1px solid #fff4;
            border-left: 2px solid #fff4;
            border-right: 2px solid #fb04;
            border-bottom: 1px solid #fb04;

            &:disabled {
                opacity: 0.5;
            }

            &.overflow {
                color: #f44;
            }

            &::placeholder {
                color: rgb(var(--color-surface-500));
            }
        }
    }
</style>
