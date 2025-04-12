<script>
    import ChatKnobs from "./ChatKnobs/ChatKnobs.svelte"

    import { currentChat } from "../../lib/chatSession/chatSession"

    import "../../lib/appState/appStateStorage"
    import "../../lib/audio"
    import "../../lib/chatSession/chatStorage"
</script>

<header>
    {#if $currentChat}
        <div class="title">
            {#key $currentChat}
                {$currentChat.title}
            {/key}
        </div>
        <div class="knobs">
            <ChatKnobs></ChatKnobs>
        </div>
    {:else}
        <div class="not-selected">No chat selected</div>
    {/if}
</header>

<style lang="scss">
    header {
        width: auto;
        height: auto;
        background: #fb01;
        backdrop-filter: blur(15px);
        filter: drop-shadow(0 0 2em #000);
        display: flex;
        flex-direction: column;
        text-align: center;

        .title {
            font-size: 22pt;
            color: var(--color-accent);
            font-weight: bold;
            text-wrap: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            // @media (max-width: 768px) {
            //     width: 100%;
            //     font-size: var(--text-2xl) /* 1.5rem = 24px */;
            //     line-height: var(
            //         --tw-leading,
            //         var(--text-2xl--line-height) /* calc(2 / 1.5) ≈ 1.3333 */
            //     );
            // }
        }

        .knobs {
            flex: auto;
            place-self: center;
            width: 100%;
        }

        .not-selected {
            padding: calc(var(--spacing) * 2);
            font-size: var(--text-lg) /* 1.125rem = 18px */;
            line-height: var(
                --tw-leading,
                var(--text-lg--line-height) /* calc(1.75 / 1.125) ≈ 1.5556 */
            );
            color: var(--color-primary-500);
            font-weight: bold;
        }
    }
</style>
