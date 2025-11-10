<script lang="ts">
    import { ChatMediaType } from "../../../lib/chatSession/chatAttachments"
    import {
        AppMode,
        currentChat,
        currentChatMode,
    } from "../../../lib/chatSession/chatSession"
    import AsyncMediaImage from "../../components/AsyncMediaImage.svelte"

    $: currentMode = $currentChatMode

    // Get all image attachments from the current chat session
    $: allImageMedia =
        $currentChat?.messages
            ?.flatMap((message) => message.media || [])
            ?.filter((media) => media.type === ChatMediaType.IMAGE) || []
</script>

{#if currentMode === AppMode.RP}
    <div class="rp-mode-panel">
        <div class="mode-badge">
            <span class="mode-icon">🎭</span>
            <span class="mode-text">RP Mode</span>
        </div>
        {#if allImageMedia.length > 0}
            <div class="media-thumbnails">
                <div class="media-header">Media</div>
                <div class="media-grid">
                    {#each allImageMedia as media}
                        <AsyncMediaImage
                            {media}
                            cssClass="media-thumb"
                            altText="Chat Media"
                            maxWidth={"100%"}
                            maxHeight={"100%"}
                        />
                    {/each}
                </div>
            </div>
        {/if}
    </div>
{/if}

<style lang="scss">
    .rp-mode-panel {
        // padding: 0.75em 1em;
        // border-radius: 8px;
        // margin: 1em;
        // border: 1px solid transparent;
        transition: all 0.2s ease;

        background-color: color-mix(
            in srgb,
            var(--color-background) 85%,
            var(--color-accent-complement) 15%
        );
        border-color: var(--color-accent-complement);
        color: var(--color-accent-complement-lighter);
        // overflow: clip;
    }

    .media-thumbnails {
        margin-top: 1em;

        .media-header {
            font-size: 0.8em;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5em;
            opacity: 0.9;
        }

        .media-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5em;

            :global(.media-thumb) {
                // max-width: 256px;
                // max-height: 256px;
                border-radius: 4px;
                cursor: pointer;
                transition: transform 0.2s ease;

                &:hover {
                    transform: scale(1.05);
                }
            }
        }
    }
</style>
