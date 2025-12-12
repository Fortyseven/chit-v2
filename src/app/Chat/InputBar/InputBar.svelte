<script lang="ts">
    import { appActiveChat, appState } from "$lib/appState/appState"
    import {
        chatAbort,
        chatAddRoleMessage,
        chatBack,
        chatChopLatest,
        chatInProgress,
        chatLength,
        chatRunInference,
    } from "$lib/chatSession/chatActions"
    import { chatClearAllPastedMedia } from "$lib/chatSession/chatAttachments"
    import { currentChat } from "$lib/chatSession/chatSession"
    import type { CommandResult } from "$lib/inputCommands/inputCommands"
    import { handleCommand } from "$lib/inputCommands/inputCommands"
    import { toast } from "@zerodevx/svelte-toast"
    import ChatInferenceSettings from "./ChatInferenceSettings.svelte"
    import InputBar__Attachments from "./InputBar__Attachments.svelte"
    import InputBar__ChatControls from "./InputBar__ChatControls.svelte"
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

    async function _handleSlashCommand(user_message: string) {
        // handle command
        const command = user_message.substring(1).trim()
        let result: CommandResult | undefined = undefined

        try {
            result = await handleCommand(command)

            if (result.autoInferResult) {
                chatAddRoleMessage($currentChat?.id, "user", result.result)
                await chatRunInference($currentChat?.id)
            } else if (result.passToInput && inputBoxEl) {
                inputBoxValue = result.result
                inputBoxEl.value = result.result
                inputBoxEl.focus()
            }
        } catch (error) {
            toast.push(`ERR: ${error}`, {
                theme: {
                    "--toastBackground": "var(--toastErrorBackground)",
                    "--toastBarBackground": "var(--toastErrorBarBackground)",
                    "--toastColor": "var(--toastErrorColor)",
                },
            })
            inputBoxValue = ""
            inputBoxEl.value = ""
            console.error("Error launching command", error)
        } finally {
            if (result?.passToInput === false) {
                inputBoxValue = ""
                inputBoxEl.value = ""
            } else {
                return
            }
        }
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
                await _handleSlashCommand(user_message)
                return
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

            let message: string | undefined = user_message

            if (!$currentChat?.pastedMedia && message?.trim() === "") {
                return
            }

            chatAddRoleMessage(
                $currentChat?.id,
                "user",
                message || "",
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
                const value = (ev.target as HTMLTextAreaElement)?.value
                await _submitUserMessage(value)
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

            if (ev.key === "Enter" && ev.ctrlKey) {
                const target = ev.target as HTMLTextAreaElement | null
                if (target?.value) {
                    ev.preventDefault()
                    await _submitUserMessage(target.value)
                }
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
            <InputBar__ChatControls
                {inputBoxEl}
                {chatInProgress}
                doInputBarSubmit={() => _submitUserMessage(inputBoxEl?.value)}
            />
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
                    background-color: var(--color-background-darkest);
                    color: var(--color-neutral);
                    border-radius: var(--border-radius-standard);
                    font-family: var(--font-ui);
                    font-size: 1.2em;
                    height: calc(var(--input-bar-height) - 0.5em);
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
                    }

                    &:disabled {
                        opacity: 0.5;
                    }

                    &::placeholder {
                        color: var(--color-background-lighter);
                        font-style: italic;
                    }
                }
            }
        }
    }
</style>
