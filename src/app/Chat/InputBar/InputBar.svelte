<script lang="ts">
    import InputBar__Attachments from "./InputBar__Attachments.svelte"

    import { Renew, SendFilled, TrashCan, Undo } from "carbon-icons-svelte"
    import { derived } from "svelte/store"
    import { appActiveChat, appState } from "../../../lib/appState/appState"
    import {
        chatAbort,
        chatAddRoleMessage,
        chatBack,
        chatChopLatest,
        chatClearConversation,
        chatInProgress,
        chatLength,
        chatRunInference,
    } from "../../../lib/chatSession/chatActions"
    import { chatClearAllPastedMedia } from "../../../lib/chatSession/chatAttachments"
    import { chats, currentChat } from "../../../lib/chatSession/chatSession"
    import { handleCommand } from "../../../lib/inputCommands"
    import IconButton from "../../UI/IconButton.svelte"
    import ChatOptionsDropdown from "../ChatKnobs/ChatOptionsDropdown.svelte"
    import ChatInferenceSettings from "./ChatInferenceSettings.svelte"
    import InputBar__PasteHandler from "./InputBar__PasteHandler.svelte"
    import Status from "./Status/Status.svelte"

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
    async function launchCommand(command: string): Promise<string> {
        let result = ""
        try {
            result = await handleCommand(command)
        } finally {
            if (inputBoxEl) {
                inputBoxValue = result
                inputBoxEl.value = result
                inputBoxEl.focus()
            }
        }

        return ""
    }

    /* ------------------------------------------------------ */
    async function _submitUserMessage(user_message: string | undefined) {
        if (!inputBoxEl || !$appState.activeChatId) {
            throw new Error("inputBoxEl is not defined or some such")
        }

        if (user_message) {
            // process a command only if the user message starts with a slash,
            // but ignore double slashes and
            if (
                user_message.startsWith("/") &&
                !user_message.startsWith("//")
            ) {
                // handle command
                const command = user_message.substring(1).trim()
                let result = undefined
                if ((result = await launchCommand(command))) {
                    inputBoxEl.value = result
                    inputBoxValue = result
                } else {
                    // if the command is not recognized, just return
                    console.warn("Command not recognized:", command)
                    return
                }
            } else {
                // replace the first // with / and let it flow through
                // to the regular submit, ignore the rest
                user_message = user_message.replace(/^\//, "")
            }
        }
        // if the user message is empty, and we don't have any new media,
        // continue the prior inference
        else if (!$currentChat?.pastedMedia) {
            await chatRunInference($currentChat?.id)
            return
        }

        // OTHERWISE...

        let presubmit_message = inputBoxEl.value

        try {
            inputBoxEl.value = ""
            inputBoxValue = ""
            inputBoxEl.classList.remove("overflow")
            inputBoxEl.disabled = true

            let message: string = user_message

            if (!$currentChat?.pastedMedia && message?.trim() === "") {
                return
            }

            chatAddRoleMessage(
                $currentChat?.id,
                "user",
                message,
                $currentChat?.pastedMedia,
            )

            await chatRunInference($currentChat?.id) // Pass the current chat ID to chatRunInference
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
                await _submitUserMessage(ev.target?.value)
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

            if (ev.key === "Enter" && ev.ctrlKey && ev.target?.value) {
                ev.preventDefault()
                await _submitUserMessage(ev.target?.value)
            }
        } else if (ev.key == "Escape") {
            ev.preventDefault()
            chatAbort()
        }
    }

    /* ------------------------------------------------------ */
    async function onBtnReroll() {
        chatChopLatest()
        await chatRunInference()
    }

    /* ------------------------------------------------------ */
    function onBtnBack() {
        if (chatLength() === 0) {
            chatClearAllPastedMedia()
        } else {
            let usermsg = chatBack()

            if (inputBoxEl && usermsg) {
                inputBoxEl.value = usermsg as string
            }
        }
    }

    /* ------------------------------------------------------ */
    function onBtnClear() {
        if (inputBoxEl) {
            inputBoxEl.value = ""
        }
        chatClearAllPastedMedia()
        chatClearConversation()

        // Dispatch custom event to clear all floating images
        window.dispatchEvent(new CustomEvent("clearFloatingImages"))
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
                    placeholder="Use /help for slash commands, or type your message here..."
                    rows="1"
                    bind:this={inputBoxEl}
                    bind:value={inputBoxValue}
                    onkeypress={onInputKeypress}
                    disabled={$chatInProgress}
                ></textarea>
            </div>
            <div class="attachments">
                <InputBar__Attachments {inputBoxEl} />
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
                            disabled={(!$hasMessages || $chatInProgress) &&
                                !$currentChat?.pastedMedia?.length}
                            iconComponent={Undo}
                            roundCorner="sw"
                        />

                        <IconButton
                            title="Clear"
                            warning
                            onClick={onBtnClear}
                            disabled={(!$hasMessages || $chatInProgress) &&
                                !$currentChat?.pastedMedia?.length}
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
                systemPromptLength={$currentChat?.systemPrompt?.length}
            />
        </div>
    </div>
{/key}

<style lang="scss">
    #InputBox {
        width: inherit;
        background: #fb01;
        backdrop-filter: blur(15px);
        filter: drop-shadow(0 0 2em #000);
        padding-block-start: 1em;

        --input-bar-height: 100px;

        .inner {
            display: grid;
            grid-template-columns: 11.5em minmax(0, 1fr) auto auto;
            gap: 0.5em;
            width: 100%;
            max-width: var(--timeline-max-width);
            margin-inline: auto;

            .user-prompt {
                &:disabled {
                    opacity: 0.5;
                }

                textarea {
                    box-sizing: border-box;
                    background-color: black;
                    color: var(--color-neutral-darker);
                    border-radius: var(--border-radius-standard);
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
            }
            .chat-controls {
                display: flex;
                gap: 0.5em;

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
                    position: relative;
                }
            }
        }
    }
</style>
