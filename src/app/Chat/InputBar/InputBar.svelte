<script lang="ts">
    import { Renew, SendFilled, TrashCan, Undo } from "carbon-icons-svelte"
    import { derived } from "svelte/store"
    import { appActiveChat, appState } from "../../../lib/appState/appState"
    import {
        chatAbort,
        chatAddRoleMessage,
        chatBack,
        chatChopLatest,
        chatClearConversation,
        chatClearPastedMedia,
        chatInProgress,
        chatLength,
        chatRunInference,
    } from "../../../lib/chatSession/chatActions"
    import { chats, currentChat } from "../../../lib/chatSession/chatSession"
    import IconButton from "../../UI/IconButton.svelte"
    import Pill from "../../UI/Pill/Pill.svelte"
    import ChatOptionsDropdown from "../ChatKnobs/ChatOptionsDropdown.svelte"
    import ChatInferenceSettings from "./ChatInferenceSettings.svelte"
    import InputBar__PasteHandler from "./InputBar__PasteHandler.svelte"
    import Status from "./Status.svelte"

    let inputBoxEl: HTMLTextAreaElement | undefined = undefined

    let inputBoxValue = "" // for reactivity

    $: if (inputBoxEl) {
        inputBoxEl.focus()
    }

    $: inputLength = inputBoxValue.length

    /* ------------------------------------------------------ */
    chatInProgress.subscribe((value) => {
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

        if (!user_message && !$currentChat?.pastedMedia) {
            chatRunInference($currentChat?.id)
            return
        }

        let presubmit_message = inputBoxEl.value

        try {
            inputBoxEl.value = ""
            inputBoxValue = ""
            inputBoxEl.classList.remove("overflow")
            inputBoxEl.disabled = true

            let message = user_message

            console.log("submit_user_message", message)

            if (!$currentChat?.pastedMedia && message.trim() === "") {
                return
            }

            chatAddRoleMessage(
                $currentChat?.id,
                "user",
                message,
                $currentChat?.pastedMedia,
            )

            chatRunInference($currentChat?.id) // Pass the current chat ID to chatRunInference
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
        if (ev.ctrlKey) {
            // reroll last response
            if (ev.key === "e" && ev.ctrlKey) {
                ev.preventDefault()
                onBtnReroll()
            }

            // go back one response
            if (ev.key === "b" && ev.ctrlKey) {
                ev.preventDefault()
                onBtnBack()
            }

            if (ev.key === "Enter" && ev.ctrlKey && ev.target.value) {
                ev.preventDefault()
                await _submitUserMessage(ev.target.value)
            }
        } else if (ev.key == "Escape") {
            ev.preventDefault()
            chatAbort()
        }
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
    function onBtnClear() {
        if (inputBoxEl) {
            inputBoxEl.value = ""
        }
        chatClearPastedMedia()
        chatClearConversation()
    }

    /* ------------------------------------------------------ */
    const hasMessages = derived(
        [chats, appActiveChat],
        ([$chats, $appActiveChat]) => {
            return chatLength() > 0
        },
    )
</script>

<svelte:window onkeydown={onGlobalKeypress} />
<InputBar__PasteHandler />

{#key $appActiveChat}
    <div id="InputBox">
        <div class="inner">
            <div class="chat-settings">
                <ChatInferenceSettings />
            </div>
            <div class="user-prompt">
                <textarea
                    name="prompt"
                    id="prompt"
                    placeholder="Write a message..."
                    rows="1"
                    bind:this={inputBoxEl}
                    bind:value={inputBoxValue}
                    onkeypress={onInputKeypress}
                    disabled={$chatInProgress}
                ></textarea>
            </div>
            <div class="attachments">
                {#if $currentChat?.pastedMedia}
                    <Pill
                        text="Image"
                        dismissible
                        color="var(--color-accent-complement)"
                        on:dismiss={() => {
                            chatClearPastedMedia()
                        }}
                    >
                        <!-- svelte-ignore a11y_missing_attribute -->
                        <img
                            src={$currentChat?.pastedMedia}
                            class="max-h-48 m-auto"
                        />
                    </Pill>
                {/if}
            </div>
            <div class="chat-controls">
                <button
                    onclick={() => _submitUserMessage(inputBoxEl?.value)}
                    disabled={$chatInProgress}
                    class="btn-send"
                >
                    <div>
                        Send&nbsp;<SendFilled />
                    </div>
                </button>
                {#key $hasMessages}
                    <div class="btn-grid">
                        <IconButton
                            title="Reroll last response (Ctrl+E)"
                            onClick={onBtnReroll}
                            disabled={!$hasMessages || $chatInProgress}
                            iconComponent={Renew}
                            roundCorner="nw"
                        />

                        <ChatOptionsDropdown></ChatOptionsDropdown>

                        <IconButton
                            title="Go back one response (Ctrl+B)"
                            onClick={onBtnBack}
                            disabled={!$hasMessages || $chatInProgress}
                            iconComponent={Undo}
                            roundCorner="sw"
                        />

                        <IconButton
                            title="Clear"
                            warning
                            onClick={onBtnClear}
                            disabled={!$hasMessages || $chatInProgress}
                            iconComponent={TrashCan}
                            roundCorner="se"
                        />
                    </div>
                {/key}
            </div>
        </div>
        <div class="under">
            <Status
                {inputLength}
                systemPromptLength={$currentChat.system_prompt?.length}
            />
        </div>
    </div>
{/key}

<style lang="scss">
    #InputBox {
        width: inherit;
        // height: 150px;
        background: #fb01;
        backdrop-filter: blur(15px);
        filter: drop-shadow(0 0 2em #000);
        padding-block: 1em;

        --input-bar-height: 100px;

        .inner {
            display: grid;
            grid-template-columns: 11.5em minmax(0, 1fr) auto auto;
            gap: 1em;
            width: 100%;
            max-width: var(--timeline-max-width);
            margin-inline: auto;

            .chat-settings {
            }
            .user-prompt {
                &:disabled {
                    opacity: 0.5;
                }

                textarea {
                    box-sizing: border-box;
                    background-color: black;
                    color: var(--color-neutral-darker);
                    border-radius: var(--theme-rounded-container);
                    font-family: var(--font-ui);
                    font-size: 1.2em;
                    height: calc(var(--input-bar-height) - 0.5em);
                    // outline-style: none;
                    width: 100%;
                    height: 100%;
                    border-top: 1px solid #fff4;
                    border-left: 2px solid #fff4;
                    border-right: 2px solid #fb04;
                    border-bottom: 1px solid #fb04;
                    padding: 0.3em;

                    &:focus {
                        color: var(--color-neutral);
                        outline: 1px solid var(--color-accent-darker);
                        // border-color: ;
                    }

                    &:disabled {
                        opacity: 0.5;
                    }

                    // &.overflow {
                    //     color: #f44;
                    // }

                    &::placeholder {
                        color: #292929;
                        font-style: italic;
                        font-family: sans-serif;
                    }
                }

                .btn-image-attach {
                    position: relative;
                    right: 0;
                    top: 0;
                }
            }
            .chat-controls {
                display: flex;
                gap: 1em;

                button {
                    background-color: var(--color-primary-500);
                    flex: auto;
                    text-align: center;
                    width: calc(var(--spacing) * 24);
                    height: 100%;
                    line-height: 1;
                    &:disabled {
                        opacity: 50%;
                    }
                }

                button.btn-send div {
                    display: flex;
                    flex-direction: row;
                    place-content: center;
                    gap: calc(var(--spacing) * 2);
                }

                .btn-grid {
                    width: 100px;
                    height: 100%;
                    display: grid;
                    grid-template-columns: auto auto;
                    grid-template-rows: auto auto;
                    gap: 2px;
                    place-content: center;
                }
            }
        }
    }
</style>
