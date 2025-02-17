<script>
    import { currentChat } from "../../../nudes/chatSession"

    let inputBoxEl = undefined

    $: if (inputBoxEl) {
        inputBoxEl.focus()
    }

    // async function submit_user_message(user_message) {
    //     let presubmit_message = inputBoxEl.value

    //     try {
    //         inputBoxEl.value = ""
    //         inputBoxEl.disabled = true
    //         let message = user_message //|| inputBoxEl.value
    //         if (message.trim() === "") {
    //             return
    //         }

    //         // await $currentChat.id.submitUserMessage(message)
    //     } catch (e) {
    //         // restore the message if it fails
    //         inputBoxEl.value = presubmit_message
    //         console.error(e)
    //     } finally {
    //         inputBoxEl.disabled = false
    //         inputBoxEl.focus()
    //     }
    // }

    // async function onInputKeypress(ev) {
    //     if (ev.key === "Enter") {
    //         if (!ev.shiftKey) {
    //             ev.preventDefault()
    //             await submit_user_message(ev.target.value)
    //         }
    //     }
    // }
</script>

<div id="InputBox" class="input-group">
    <button class="input-group-shim">+</button>
    <textarea
        class="bg-transparent border-0 ring-0"
        name="prompt"
        id="prompt"
        placeholder="Write a message..."
        rows="1"
        bind:this={inputBoxEl}
    ></textarea>
    <!-- onkeypress={onInputKeypress} -->
    <button
        class="variant-filled-primary"
        onclick={() => submit_user_message(inputBoxEl.value)}>Send</button
    >
</div>

<style lang="scss">
    #InputBox {
        display: grid;
        gap: 1em;
        padding: 1rem;
        bottom: 0px;
        position: absolute;
        border-radius: var(--theme-rounded-container);
        grid-template-columns: auto 1fr auto auto;

        textarea {
            background-color: rgb(var(--color-surface-800));
            border-bottom: 1px solid rgb(var(--color-surface-400));
            border-radius: var(--theme-rounded-container);
            border-top: 1px solid rgb(var(--color-surface-800));
            border: none;
            color: var(--primary-fg);
            flex: auto;
            font-family: inherit;
            font-size: 1.2em;
            outline-style: none;
            padding: 0.5em;
            width: 100%;

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
