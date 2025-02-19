<script lang="ts">
    import { onMount } from "svelte"
    import {
        chatAddMessage,
        chatAddRoleMessage,
        chatBack,
        chatRunInference,
    } from "../../../chatSession/chatActions"
    import { activeChatId } from "../../../chatSession/chatSession"

    let inputBoxEl: HTMLTextAreaElement | undefined = undefined

    $: if (inputBoxEl) {
        inputBoxEl.focus()
    }

    async function submit_user_message(user_message: String | undefined) {
        if (!inputBoxEl || !$activeChatId) {
            throw new Error("inputBoxEl is not defined or some such")
        }

        if (!user_message) {
            chatRunInference($activeChatId)
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

            chatAddRoleMessage($activeChatId, "user", message)

            chatRunInference($activeChatId)
        } catch (e) {
            // restore the message if it fails
            inputBoxEl.value = presubmit_message
            console.error(e)
        } finally {
            inputBoxEl.disabled = false
            inputBoxEl.focus()
        }
    }

    async function onInputKeypress(ev) {
        if (ev.key === "Enter") {
            if (!ev.shiftKey) {
                ev.preventDefault()
                await submit_user_message(ev.target.value)
            }
        }
    }
</script>

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
        <div class="flex flex-col flex-auto gap-1">
            <button
                class="variant-filled-primary w-full p-1 flex-auto"
                onclick={() => {
                    chatBack($activeChatId)
                    chatRunInference($activeChatId)
                }}
            >
                Reroll
            </button>
            <button
                class="variant-filled-primary w-full p-1 flex-auto"
                onclick={() => chatBack($activeChatId)}
            >
                Back
            </button>
        </div>
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
