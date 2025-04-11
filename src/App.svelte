<script>
    import { afterUpdate } from "svelte"

    import PageContent from "./PageContent.svelte"
    import ChatKnobs from "./app/Chat/ChatKnobs/ChatKnobs.svelte"
    import InputBar from "./app/Chat/InputBar/InputBar.svelte"
    import ConvoSidebar from "./app/ChatSidebar/Sidebar.svelte"
    import AppFramework from "./app/UI/AppFramework/AppFramework.svelte"

    import { currentChat } from "./lib/chatSession/chatSession"

    import "./appState/appStateStorage"
    import "./lib/audio"
    import "./lib/chatSession/chatStorage"

    let scrollWindowEl = undefined

    function scrollDown() {
        setTimeout(
            () => scrollWindowEl?.scrollTo(0, scrollWindowEl.scrollHeight),
            50,
        )
    }

    currentChat.subscribe(scrollDown)

    afterUpdate(scrollDown)
</script>

<AppFramework>
    <div slot="sidebar">
        <ConvoSidebar />
    </div>
    <div slot="content" class="page" bind:this={scrollWindowEl}>
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
        <PageContent />
        <div class="input-bar"><InputBar /></div>
    </div>
</AppFramework>

<style lang="scss">
    .page {
        // display: block;
        box-sizing: border-box;
        // width: inherit;
        height: 100%;
        overflow-y: scroll;
        position: relative;
        border: 1px solid red;
    }

    header {
        width: 100%;
        height: auto;
        background: #fb01;
        backdrop-filter: blur(15px);
        filter: drop-shadow(0 0 2em #000);
        position: sticky;
        // width: inherit;
        top: calc(var(--spacing) * 0);
        z-index: 50;
        background-color: var(--color-neutral-800);
        vertical-align: middle;
        margin: auto;
        display: flex;
        flex-direction: column;
        place-content: center;

        .title {
            padding: calc(var(--spacing) * 2);
            font-size: var(--text-lg) /* 1.125rem = 18px */;
            line-height: var(
                --tw-leading,
                var(--text-lg--line-height) /* calc(1.75 / 1.125) ≈ 1.5556 */
            );
            color: var(--color-primary-500);
            font-weight: bold;
            flex: auto;
            text-wrap: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            width: calc(3 / 4 * 100%);
            @media (width >= 48rem /* 768px */) {
                width: 100%;
                font-size: var(--text-2xl) /* 1.5rem = 24px */;
                line-height: var(
                    --tw-leading,
                    var(--text-2xl--line-height) /* calc(2 / 1.5) ≈ 1.3333 */
                );
            }
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

    .input-bar {
        position: sticky;
        bottom: 0;
        z-index: 50;
        width: inherit;
    }
</style>
