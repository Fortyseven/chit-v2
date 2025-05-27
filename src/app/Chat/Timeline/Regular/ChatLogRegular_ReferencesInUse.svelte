<script lang="ts">
    import {
        BackpackMode,
        currentChat,
    } from "../../../../lib/chatSession/chatSession"
    import Pill from "../../../UI/Pill/Pill.svelte"
</script>

{#if $currentChat?.backpackReferences && $currentChat?.backpackMode !== BackpackMode.OFF}
    <ul class="references">
        {#each $currentChat.backpackReferences as reference, index}
            <li class="reference-item">
                <span class="ref-tool-id">{reference.toolId}:</span>
                {#if reference.referenceUrl}
                    <a
                        href={reference.referenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {reference.referenceUrl}
                    </a>
                {:else}
                    <span class="ref-content">{reference.referenceContent}</span
                    >
                {/if}
            </li>
        {/each}
    </ul>
{/if}

<style lang="scss">
    ul.references {
        font-size: 0.8em;
        font-family: monospace;
        color: white;
        a {
            color: var(--color-accent-complement);
            text-decoration: none;
        }
        list-style: disc;
        line-height: 1;
        // padding: 0;
        // margin: 0;
        .ref-tool-id {
            color: var(--color-accent);
        }
        .ref-content {
            color: var(--color-text);
        }
    }
</style>
