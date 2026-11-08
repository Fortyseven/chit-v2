<script lang="ts">
    import { onMount } from "svelte"
    import { Close } from "svelte-google-materialdesign-icons"
    import { rpSettingsDialogOpen } from "$lib/appState/rpSettingsDialogState"
    import { chatSetRPTracking } from "$lib/chatSession/chatActions"
    import { currentChat } from "$lib/chatSession/chatSession"
    import { DEFAULT_RP_TRACKING } from "$lib/rp/types"

    // Local stores mirroring the chat settings. Values are written back
    // only when the user actually flips a checkbox (see on:change), so
    // mounting the dialog or switching chats never touches the chat.
    $: trackingEnabled =
        $currentChat?.rpTracking?.enabled ?? DEFAULT_RP_TRACKING.enabled
    $: injectState =
        $currentChat?.rpTracking?.injectState ?? DEFAULT_RP_TRACKING.injectState

    $: toolsDisabled = !$currentChat?.toolsEnabled

    function closeDialog() {
        $rpSettingsDialogOpen = false
    }

    onMount(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeDialog()
        }
        window.addEventListener("keydown", handleKey)
        return () => window.removeEventListener("keydown", handleKey)
    })
</script>

{#if $rpSettingsDialogOpen}
    <div
        class="rp-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="RP story tracking settings"
    >
        <div class="backdrop" on:click={closeDialog}></div>
        <div class="rp-modal">
            <h2>RP Story Tracking</h2>
            <p class="hint">
                While active, the model maintains a hidden record of the story
                (location, characters, stats, inventory) using tools, and the
                record follows the conversation — rewinding restores it
                automatically.
            </p>

            {#if toolsDisabled}
                <p class="warning">
                    Tools are disabled for this chat. Enable tools (TOOL toggle)
                    to use story tracking.
                </p>
            {/if}

            <div class="fields">
                <label class="setting-row">
                    <span>Track story state</span>
                    <span class="desc">
                        Expose the rp_start_scenario, rp_get_state, and
                        rp_update_state tools
                    </span>
                    <input
                        type="checkbox"
                        bind:checked={trackingEnabled}
                        on:change={(e) =>
                            chatSetRPTracking(
                                "",
                                { enabled: (e.currentTarget as HTMLInputElement).checked }
                            )}
                        disabled={toolsDisabled}
                    />
                </label>

                <label class="setting-row">
                    <span>Inject state into prompt</span>
                    <span class="desc">
                        Append the current story state to the system prompt each
                        turn (recommended)
                    </span>
                    <input
                        type="checkbox"
                        bind:checked={injectState}
                        on:change={(e) =>
                            chatSetRPTracking(
                                "",
                                {
                                    injectState: (e.currentTarget as HTMLInputElement).checked,
                                }
                            )}
                        disabled={toolsDisabled || !trackingEnabled}
                    />
                </label>
            </div>

            <button class="close-btn" on:click={closeDialog}>
                <Close size="1em" />
                <span>Close</span>
            </button>
        </div>
    </div>
{/if}

<style lang="scss">
    .rp-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        pointer-events: none;

        .backdrop {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            pointer-events: auto;
        }

        .rp-modal {
            position: relative;
            background: #222;
            color: white;
            width: 80%;
            max-width: 560px;
            padding: 1em;
            border-radius: var(--border-radius-standard);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            pointer-events: auto;
            box-sizing: border-box;

            h2 {
                padding: 0;
                margin: 0 0 1em 0;
                padding-bottom: 0.5em;
                border-bottom: 1px solid #555;
            }
        }
    }

    .hint {
        color: var(--color-text-muted, #888);
        font-size: 0.85em;
        margin: 0 0 1em 0;
        line-height: 1.4;
    }

    .warning {
        color: var(--color-warning-text, #ffc857);
        font-size: 0.85em;
        margin: 0 0 1em 0;
    }

    .fields {
        display: flex;
        flex-direction: column;
        gap: 0.75em;
        margin-bottom: 1em;

        .setting-row {
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: start;
            gap: 0.25em 0.75em;

            > span:first-child {
                font-weight: bold;
            }

            .desc {
                grid-column: 1 / -1;
                font-size: 0.8em;
                color: var(--color-text-muted, #888);
                font-weight: normal;
                line-height: 1.3;
            }

            input[type="checkbox"] {
                accent-color: var(--color-accent);
                cursor: pointer;
                width: auto;
                margin-top: 0.2em;

                &:disabled {
                    cursor: not-allowed;
                    opacity: 0.5;
                }
            }

            &:has(input:disabled) {
                opacity: 0.7;

                > span:first-child {
                    opacity: 0.7;
                }
            }
        }
    }

    .close-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4em;
        background: var(--color-background-darkest, #1a1a1a);
        color: var(--color-accent, #7c4dff);
        border: 1px solid #555;
        border-radius: var(--border-radius-standard);
        padding: 0.4em 1em;
        font-size: 0.85em;
        font-weight: 600;
        cursor: pointer;

        &:hover {
            border-color: var(--color-accent, #7c4dff);
        }
    }
</style>
