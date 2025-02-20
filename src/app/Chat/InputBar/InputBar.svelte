<script lang="ts">
    import { derived } from "svelte/store"
    import { appState } from "../../../chatSession/appState"
    import {
        chatAddRoleMessage,
        chatBack,
        chatChopLatest,
        chatLength,
        chatRunInference,
    } from "../../../chatSession/chatActions"
    import { chats } from "../../../chatSession/chatSession"

    let inputBoxEl: HTMLTextAreaElement | undefined = undefined

    $: if (inputBoxEl) {
        inputBoxEl.focus()
    }

    async function submit_user_message(user_message: String | undefined) {
        if (!inputBoxEl || !$appState.activeChatId) {
            throw new Error("inputBoxEl is not defined or some such")
        }

        if (!user_message) {
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

    async function onInputKeypress(ev: KeyboardEvent) {
        if (ev.key === "Enter") {
            if (!ev.shiftKey) {
                ev.preventDefault()
                await submit_user_message(ev.target.value)
            }
        }
    }

    async function onGlobalKeypress(ev: KeyboardEvent) {
        if (ev.key === "e" && ev.ctrlKey) {
            ev.preventDefault()
            onBtnReroll()
        }

        if (ev.key === "b" && ev.ctrlKey) {
            ev.preventDefault()
            onBtnBack()
        }

        if (inputBoxEl) {
            inputBoxEl.focus()
        }
    }

    function onBtnReroll() {
        chatChopLatest()
        chatRunInference()
    }

    function onBtnBack() {
        let usermsg = chatBack()

        if (inputBoxEl && usermsg) {
            inputBoxEl.value = usermsg as string
        }
    }

    const hasMessages = derived([chats], ([$chats]) => {
        return chatLength() > 0
    })
</script>

<svelte:window on:keydown={onGlobalKeypress} />

<div id="InputBox" class="bg-neutral-800 w-full flex flex-row gap-2 p-4">
    <div class="flex flex-auto basis-[50%]">
        <textarea
            name="prompt"
            id="prompt"
            placeholder="Write a message..."
            rows="1"
            bind:this={inputBoxEl}
            onkeypress={onInputKeypress}
        ></textarea>
    </div>
    <div class="flex flex-row flex-auto gap-1 flex-grow-0">
        <button
            class="variant-filled-primary flex-auto text-center w-auto h-full"
            onclick={() => submit_user_message(inputBoxEl?.value)}>Send</button
        >
        {#key $hasMessages}
            <div class="flex flex-col flex-auto gap-1">
                <button
                    class="variant-filled-primary w-full p-1 flex-auto disabled:opacity-50"
                    onclick={onBtnReroll}
                    disabled={!$hasMessages}
                >
                    Reroll
                </button>
                <button
                    class="variant-filled-primary w-full p-1 flex-auto disabled:opacity-50"
                    onclick={onBtnBack}
                    disabled={!$hasMessages}
                >
                    Back
                </button>
            </div>
        {/key}
    </div>
</div>

<style lang="scss">
    #InputBox {
        border-radius: var(--theme-rounded-container);

        textarea {
            border-radius: var(--theme-rounded-container);
            font-size: 1.2em;
            outline-style: none;
            width: 100%;
            height: 100%;
            padding: 0.5em;
            background-color: rgb(var(--color-surface-900));

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
