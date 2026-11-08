<script lang="ts">
    import { currentChat } from "$lib/chatSession/chatSession"
    import { getCurrentRPState, rpStateInjectionActive, rpTrackingActive } from "$lib/rp/state"

    $: trackingActive = rpTrackingActive($currentChat)
    $: injectionActive = rpStateInjectionActive($currentChat)
    $: state = trackingActive ? getCurrentRPState($currentChat) : null

    /** Format one stat value compactly for display. */
    function formatStat(value: any): string {
        if (typeof value === "number") return String(value)
        if (typeof value === "string") return value
        if (Array.isArray(value)) return value.join(", ")
        if (value === null || value === undefined) return ""
        try {
            return JSON.stringify(value)
        } catch {
            return String(value)
        }
    }
</script>

{#if trackingActive}
    <div class="state-panel">
        <div class="state-header">
            <span>STORY STATE</span>
            {#if state && !injectionActive}
                <span class="state-off">not in prompt</span>
            {/if}
        </div>

        {#if state}
            {#if state.title}
                <div class="state-title">{state.title}</div>
            {/if}

            {#if state.location.name || state.location.description}
                <div class="state-row">
                    <span class="row-label">Location</span>
                    <span class="row-value">
                        {state.location.name}
                        {#if state.location.name && state.location.description}
                            — {state.location.description}
                        {/if}
                        {#if !state.location.name && state.location.description}
                            {state.location.description}
                        {/if}
                    </span>
                </div>
            {/if}

            {#if state.characters.length > 0}
                <div class="state-characters">
                    {#each state.characters as c (c.name)}
                        <div class="state-character">
                            <div class="char-name">{c.name}</div>
                            {#if c.status}
                                <div class="char-status">{c.status}</div>
                            {/if}
                            {#if Object.keys(c.stats).length > 0}
                                <div class="char-stats">
                                    {#each Object.entries(c.stats) as [key, value] (key)}
                                        <span class="chip">
                                            {key}: {formatStat(value)}
                                        </span>
                                    {/each}
                                </div>
                            {/if}
                            {#if c.inventory.length > 0}
                                <div class="char-inventory">
                                    {#each c.inventory as item (item)}
                                        <span class="chip inv">{item}</span>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}

            {#if state.notes}
                <div class="state-notes">
                    <span class="row-label">Notes</span>
                    <div class="notes-body">{state.notes}</div>
                </div>
            {/if}
        {:else}
            <div class="state-empty">
                No story tracked yet. The model starts the record when the
                scene begins (rp_start_scenario).
            </div>
        {/if}
    </div>
{/if}

<style lang="scss">
    .state-panel {
        margin-top: 1em;
        border: 1px solid #444;
        border-radius: var(--border-radius-standard);
        padding: 0.6em;
        display: flex;
        flex-direction: column;
        gap: 0.55em;
        font-size: 0.85em;

        .state-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.85em;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            opacity: 0.9;

            .state-off {
                font-size: 0.8em;
                font-weight: 400;
                opacity: 0.6;
                text-transform: none;
                letter-spacing: normal;
            }
        }

        .state-title {
            font-weight: 700;
        }

        .state-row {
            display: flex;
            flex-direction: column;
            gap: 0.1em;

            .row-value {
                line-height: 1.35;
            }
        }

        .row-label {
            font-size: 0.85em;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            opacity: 0.7;
        }

        .state-characters {
            display: flex;
            flex-direction: column;
            gap: 0.5em;

            .state-character {
                display: flex;
                flex-direction: column;
                gap: 0.25em;
                border-left: 2px solid #555;
                padding-left: 0.5em;

                .char-name {
                    font-weight: 700;
                }

                .char-status {
                    font-size: 0.9em;
                    opacity: 0.85;
                    line-height: 1.3;
                }

                .char-stats,
                .char-inventory {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.25em;

                    .chip {
                        background: var(--color-background-darkest);
                        border: 1px solid #555;
                        border-radius: var(--border-radius-standard);
                        padding: 0.05em 0.45em;
                        font-size: 0.85em;
                        font-family: monospace;
                    }

                    .inv {
                        border-style: dashed;
                    }
                }
            }
        }

        .state-notes {
            display: flex;
            flex-direction: column;
            gap: 0.2em;

            .notes-body {
                white-space: pre-wrap;
                line-height: 1.4;
                opacity: 0.9;
            }
        }

        .state-empty {
            font-size: 0.9em;
            opacity: 0.65;
            line-height: 1.4;
        }
    }
</style>
