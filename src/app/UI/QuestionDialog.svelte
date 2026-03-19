<script>
    import { onDestroy } from "svelte"
    import {
        closeQuestionDialog,
        questionDialog,
        submitAnswer,
    } from "../../lib/tools/questionDialog"

    let keydownHandler
    let freeformInput = ""
    let selectedOption = null

    function handleSubmit() {
        if (selectedOption === "__freeform__") {
            if (!freeformInput.trim()) {
                return
            }
            submitAnswer(freeformInput)
        } else if (selectedOption) {
            submitAnswer(selectedOption)
        } else if ($questionDialog.hasFreefrom) {
            if (!freeformInput.trim()) {
                return
            }
            submitAnswer(freeformInput)
        }
        freeformInput = ""
        selectedOption = null
    }

    function handleCancel() {
        closeQuestionDialog()
        freeformInput = ""
        selectedOption = null
    }

    function handleKeydown(event) {
        if (event.key === "Escape" && $questionDialog.open) {
            handleCancel()
        } else if (event.key === "Enter" && $questionDialog.open) {
            event.preventDefault()
            handleSubmit()
        }
    }

    $: {
        if ($questionDialog.open) {
            window.addEventListener("keydown", handleKeydown)
            keydownHandler = handleKeydown
        } else if (keydownHandler) {
            window.removeEventListener("keydown", handleKeydown)
        }
    }

    onDestroy(() => {
        if (keydownHandler) {
            window.removeEventListener("keydown", handleKeydown)
        }
    })
</script>

{#if $questionDialog.open}
    <div class="question-dialog-overlay">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="backdrop" on:click={handleCancel}></div>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="question-dialog" on:click|stopPropagation>
            <div class="dialog-content">
                <h3>{$questionDialog.question}</h3>

                {#if $questionDialog.options.length > 0}
                    <div class="options">
                        {#each $questionDialog.options as option (option.value)}
                            <label class="option">
                                <input
                                    type="radio"
                                    name="answer"
                                    value={option.value}
                                    bind:group={selectedOption}
                                    on:change={() => {
                                        freeformInput = ""
                                    }}
                                />
                                <span>{option.label}</span>
                            </label>
                        {/each}
                    </div>

                    {#if selectedOption === "__freeform__"}
                        <input
                            type="text"
                            class="freeform-input"
                            placeholder="Enter your answer..."
                            bind:value={freeformInput}
                            autofocus
                        />
                    {/if}
                {:else}
                    <textarea
                        class="freeform-textarea"
                        placeholder="Enter your answer..."
                        bind:value={freeformInput}
                        autofocus
                    ></textarea>
                {/if}
            </div>

            <div class="dialog-buttons">
                <button class="btn-cancel" on:click={handleCancel}
                    >Cancel</button
                >
                <button
                    class="btn-submit"
                    on:click={handleSubmit}
                    disabled={!freeformInput.trim() && !selectedOption}
                >
                    Submit
                </button>
            </div>
        </div>
    </div>
{/if}

<style lang="scss">
    .question-dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        pointer-events: none;

        .backdrop {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            pointer-events: auto;
        }

        .question-dialog {
            position: relative;
            background: #1e1e1e;
            color: #e0e0e0;
            width: 90%;
            max-width: 500px;
            padding: 2em;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            pointer-events: auto;
            z-index: 10001;
            display: flex;
            flex-direction: column;
            gap: 1.5em;

            .dialog-content {
                display: flex;
                flex-direction: column;
                gap: 1em;

                h3 {
                    margin: 0;
                    font-size: 1.2em;
                    font-weight: 600;
                    color: #ffffff;
                }

                .options {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75em;

                    .option {
                        display: flex;
                        align-items: center;
                        gap: 0.75em;
                        cursor: pointer;
                        padding: 0.75em;
                        border-radius: 6px;
                        transition: background-color 0.2s;

                        &:hover {
                            background-color: rgba(255, 255, 255, 0.1);
                        }

                        input[type="radio"] {
                            cursor: pointer;
                            flex-shrink: 0;
                        }

                        span {
                            user-select: none;
                        }
                    }
                }

                input.freeform-input,
                textarea.freeform-textarea {
                    padding: 0.75em;
                    border: 1px solid #444;
                    border-radius: 6px;
                    background: #2a2a2a;
                    color: #e0e0e0;
                    font-family: inherit;
                    font-size: 1em;

                    &:focus {
                        outline: none;
                        border-color: #e74c3c;
                        background: #333;
                    }

                    &::placeholder {
                        color: #666;
                    }
                }

                textarea.freeform-textarea {
                    min-height: 100px;
                    resize: vertical;
                }
            }

            .dialog-buttons {
                display: flex;
                gap: 1em;
                justify-content: flex-end;

                button {
                    padding: 0.75em 1.5em;
                    border: 1px solid #444;
                    border-radius: 6px;
                    background: #2a2a2a;
                    color: #e0e0e0;
                    cursor: pointer;
                    font-size: 1em;
                    transition: all 0.2s;

                    &:hover:not(:disabled) {
                        background: #333;
                        border-color: #555;
                    }

                    &:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }

                    &.btn-submit {
                        background: #e74c3c;
                        border-color: #c0392b;
                        color: #ffffff;

                        &:hover:not(:disabled) {
                            background: #c0392b;
                            border-color: #a93226;
                        }
                    }
                }
            }
        }
    }
</style>
