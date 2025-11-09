<script lang="ts">
    import { AppMode, currentChatMode } from "../../lib/chatSession/chatSession"

    $: currentMode = $currentChatMode
</script>

{#if currentMode === AppMode.RP}
    <div class="mode-indicator rp-mode">
        <div class="mode-badge">
            <span class="mode-icon">🎭</span>
            <span class="mode-text">RP Mode</span>
        </div>
        <div class="mode-description">
            Role-playing mode active. UI elements optimized for character
            interactions.
        </div>
    </div>
{:else}
    <div class="mode-indicator default-mode">
        <div class="mode-badge">
            <span class="mode-icon">💬</span>
            <span class="mode-text">Default Mode</span>
        </div>
        <div class="mode-description">
            Standard chat mode with general-purpose features.
        </div>
    </div>
{/if}

<style lang="scss">
    .mode-indicator {
        padding: 0.75em 1em;
        border-radius: 8px;
        margin: 1em;
        border: 1px solid transparent;
        transition: all 0.2s ease;

        .mode-badge {
            display: flex;
            align-items: center;
            gap: 0.5em;
            font-weight: 600;
            margin-bottom: 0.25em;

            .mode-icon {
                font-size: 1.2em;
            }

            .mode-text {
                font-size: 0.9em;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
        }

        .mode-description {
            font-size: 0.8em;
            opacity: 0.8;
            font-style: italic;
        }

        &.rp-mode {
            background-color: color-mix(
                in srgb,
                var(--color-background) 85%,
                var(--color-accent-complement) 15%
            );
            border-color: var(--color-accent-complement);
            color: var(--color-accent-complement-lighter);
        }

        &.default-mode {
            background-color: color-mix(
                in srgb,
                var(--color-background) 90%,
                var(--color-accent) 10%
            );
            border-color: var(--color-accent);
            color: var(--color-accent-lighter);
        }
    }
</style>
