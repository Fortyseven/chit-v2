<script>
    // @ts-nocheck

    import { Avatar } from "@skeletonlabs/skeleton"
    import { appState } from "../../stores/appState.svelte.js"
    import { convos } from "../../stores/chatState.svelte.js"

    $inspect(convos)
</script>

<div class="bg-surface-900 h-full">
    {#if convos?.entries}
        <div
            class="chatlog"
        >
            {#each convos.entries[appState.currentConvoIndex].chatState.timeline as timeline_entry, i}
                {#if timeline_entry.role === "user"}
                    <div class="response user">
                        {timeline_entry.text}
                    </div>
                {:else}
                    <div class="response bot">
                        {timeline_entry.text}
                    </div>
                {/if}
            {/each}
        </div>
    {/if}
</div>

<style lang="scss">
    .chatlog {
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        width: full;
        max-width: 1024px;
        margin: auto;
        padding-inline: 1em;
    }
    .response {
        border-radius: 0.5em;
        box-shadow: 0 0.25em 0.25em 0 #000;
        text-align: start;
        padding: 0.5em;

        &.user {
            flex: auto;
            color: var(--color-primary-500);
            font-style: italic;
            line-height: 1.35em;
            width: 100%;
            overflow: scroll;
            box-shadow: none;;
            &::before {
                content: "> ";
                font-weight: bold;
            }
            font-size: 0.9em;
        }

        &.bot {
            background-image: linear-gradient(
                140deg,
                #ffffff0e 0%,
                rgba(0, 0, 0, 0.73) 100%
            );
            border-bottom: 1px solid #fff1;
            border-top-left-radius: unset;
            color: white;
        }
    }
</style>
