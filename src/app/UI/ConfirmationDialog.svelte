<script lang="ts">
    import { onDestroy } from "svelte"

    export let open = false
    export let title = "Confirm Action"
    export let message = ""
    export let confirmText = "Confirm"
    export let cancelText = "Cancel"
    export let onConfirm: () => void = () => {}
    export let onCancel: () => void = () => {}

    let keydownHandler: ((event: KeyboardEvent) => void) | undefined

    function handleConfirm() {
        open = false
        onConfirm()
    }

    function handleCancel() {
        open = false
        onCancel()
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape" && open) {
            handleCancel()
        }
    }

    $: {
        if (open) {
            window.addEventListener("keydown", handleKeydown)
            keydownHandler = handleKeydown
        } else if (keydownHandler) {
            window.removeEventListener("keydown", keydownHandler)
        }
    }

    onDestroy(() => {
        if (keydownHandler) {
            window.removeEventListener("keydown", keydownHandler)
        }
        open = false
    })
</script>

{#if open}
    <div class="confirmation-dialog">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="backdrop" on:click={handleCancel}></div>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="dialog" on:click|stopPropagation>
            <h2>{title}</h2>
            <div class="message">
                {message}
            </div>
            <div class="buttons">
                <button class="btn-cancel" on:click={handleCancel}>
                    {cancelText}
                </button>
                <button class="btn-confirm" on:click={handleConfirm}>
                    {confirmText}
                </button>
            </div>
        </div>
    </div>
{/if}

<style lang="scss">
    .confirmation-dialog {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
        pointer-events: none;

        .backdrop {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            pointer-events: auto;
        }

        .dialog {
            position: relative;
            background: #222;
            color: white;
            width: 90%;
            max-width: 600px;
            padding: 1.5em;
            border-radius: var(--border-radius-standard);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            pointer-events: auto;
            box-sizing: border-box;

            h2 {
                padding: 0;
                margin: 0;
                margin-bottom: 1em;
                padding-bottom: 0.5em;
                border-bottom: 1px solid #555;
            }

            .message {
                margin-bottom: 1.5em;
                line-height: 1.5;
                white-space: pre-wrap;
                max-height: 400px;
                overflow-y: auto;
                padding: 0.5em;
                background: #1a1a1a;
                border-radius: 4px;
            }

            .buttons {
                display: flex;
                justify-content: flex-end;
                gap: 0.5em;

                button {
                    padding: 0.5em 1em;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1em;
                    transition: background-color 0.2s;

                    &.btn-cancel {
                        background: #444;
                        color: white;

                        &:hover {
                            background: #555;
                        }
                    }

                    &.btn-confirm {
                        background: #0066cc;
                        color: white;

                        &:hover {
                            background: #0052a3;
                        }
                    }
                }
            }
        }
    }
</style>
