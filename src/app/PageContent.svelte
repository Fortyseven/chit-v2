<script lang="ts">
    import { afterUpdate, onDestroy } from "svelte"

    import ChatLogRegular from "./Chat/Timeline/Regular/ChatLogRegular.svelte"

    import {
        chatResetStreamScrollCounter,
        chatShouldScrollDuringStream,
    } from "$lib/chatSession/chatActions"
    import { chats, currentChat } from "$lib/chatSession/chatSession"
    import { streamingState } from "$lib/chatSession/streamingState"

    import "$lib/appState/appStateStorage"
    import "$lib/audio"
    import "$lib/chatSession/chatStorage"

    /* This allows the page to scroll as chat content streams in. */

    let scrollWindowEl: HTMLDivElement | undefined = undefined
    let isStreaming = false
    let userScrolledUp = false
    const SCROLL_THRESHOLD = 100 // pixels from bottom to consider "at bottom"
    let previousChatId: string | null = null
    let scrollSaveTimer: ReturnType<typeof setTimeout> | undefined
    let skipNextAfterUpdate = false

    function scrollDown(): void {
        setTimeout(
            () =>
                scrollWindowEl?.scrollTo(0, scrollWindowEl?.scrollHeight ?? 0),
            50,
        )
    }

    function isNearBottom(): boolean {
        if (!scrollWindowEl) return true
        const currentScroll = scrollWindowEl.scrollTop
        const maxScroll =
            scrollWindowEl.scrollHeight - scrollWindowEl.clientHeight
        return maxScroll - currentScroll < SCROLL_THRESHOLD
    }

    function saveScrollPosition(chatId: string | null): void {
        if (!chatId || !scrollWindowEl) return
        chats.update(($chats) =>
            $chats.map((c) =>
                c.id === chatId
                    ? { ...c, scrollTop: scrollWindowEl!.scrollTop }
                    : c,
            ),
        )
    }

    function handleScroll(): void {
        // Track if user has manually scrolled up
        userScrolledUp = !isNearBottom()

        // Debounced save of scroll position to current session
        clearTimeout(scrollSaveTimer)
        scrollSaveTimer = setTimeout(() => {
            const chat = currentChatValue
            if (chat) saveScrollPosition(chat.id)
        }, 300)
    }

    let currentChatValue: { id: string; scrollTop?: number } | null = null
    let pendingScrollRestore: number | null = null

    function restoreOrScrollDown(savedScroll: number | undefined): void {
        if (savedScroll != null) {
            if (scrollWindowEl) {
                setTimeout(() => {
                    scrollWindowEl?.scrollTo(0, savedScroll)
                }, 50)
            } else {
                // DOM not mounted yet (e.g. page reload) — defer to afterUpdate
                pendingScrollRestore = savedScroll
            }
        } else {
            scrollDown()
        }
    }

    // Track session changes to save/restore scroll position
    const unsubChat = currentChat.subscribe(($chat) => {
        const newId = $chat?.id ?? null

        if (newId !== previousChatId) {
            // Save scroll position for the outgoing session
            if (previousChatId) {
                clearTimeout(scrollSaveTimer)
                saveScrollPosition(previousChatId)
            }

            previousChatId = newId
            skipNextAfterUpdate = true

            // Restore scroll position for the incoming session
            if ($chat) {
                restoreOrScrollDown($chat.scrollTop)
            }
        }

        currentChatValue = $chat
            ? { id: $chat.id, scrollTop: $chat.scrollTop }
            : null
    })

    function performBatchedScroll(): void {
        // Only scroll if streaming is active, scroll threshold reached, and user hasn't scrolled up
        if (isStreaming && chatShouldScrollDuringStream() && !userScrolledUp) {
            scrollDown()
            chatResetStreamScrollCounter()
        }
    }

    // Track streaming state and perform batched scroll during streaming
    const unsubscribe = streamingState.subscribe(($ss) => {
        isStreaming = $ss.response_buffer.length > 0

        // If streaming just ended, reset user scroll tracking
        if (!isStreaming) {
            userScrolledUp = false
        }

        // Try to perform batched scroll if conditions are met
        performBatchedScroll()

        // Scroll to bottom when streaming completes, but only if user is near bottom
        if (!isStreaming && isNearBottom()) {
            scrollDown()
        }
    })

    onDestroy(() => {
        unsubscribe()
        unsubChat()
        clearTimeout(scrollSaveTimer)
    })

    // Scroll after component updates, but only if streaming has completed and user is near bottom
    // Skip if we just switched sessions (scroll restoration is handled by the currentChat subscription)
    afterUpdate(() => {
        // Handle deferred scroll restore (e.g. after page reload when DOM wasn't ready)
        if (pendingScrollRestore != null && scrollWindowEl) {
            const pos = pendingScrollRestore
            pendingScrollRestore = null
            setTimeout(() => {
                scrollWindowEl?.scrollTo(0, pos)
            }, 50)
            return
        }
        if (skipNextAfterUpdate) {
            skipNextAfterUpdate = false
            return
        }
        if (isStreaming) {
            return // Skip scroll updates during streaming
        }
        if (isNearBottom()) {
            scrollDown()
        }
    })
</script>

<div class="page" bind:this={scrollWindowEl} on:scroll={handleScroll}>
    <ChatLogRegular />
</div>

<style lang="scss">
    .page {
        box-sizing: border-box;
        width: inherit;
        height: 100%;
        overflow-y: auto;

        z-index: 5;

        --s: 8px; /* control the size*/
        --c1: var(--color-background-darker);
        --c2: var(--color-background);
        --c: #0000, var(--c1) 0.5deg 119.5deg, #0000 120deg;
        --g1: conic-gradient(from 60deg at 56.25% calc(425% / 6), var(--c));
        --g2: conic-gradient(from 180deg at 43.75% calc(425% / 6), var(--c));
        --g3: conic-gradient(from -60deg at 50% calc(175% / 12), var(--c));

        background:
            var(--g1),
            var(--g1) var(--s) calc(1.73 * var(--s)),
            var(--g2),
            var(--g2) var(--s) calc(1.73 * var(--s)),
            var(--g3) var(--s) 0,
            var(--g3) 0 calc(1.73 * var(--s)) var(--c2);
        background-size: calc(2 * var(--s)) calc(3.46 * var(--s));

        :global(*) {
            z-index: 7;
            // display: none;
        }

        &::after {
            z-index: 6;
            // overlay image
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            mix-blend-mode: color;

            background: linear-gradient(
                to bottom,
                #150e15 0%,
                #160f15 3.23%,
                #160f15 6.45%,
                #160f15 9.68%,
                #170f15 12.9%,
                #170f15 16.13%,
                #170f16 19.35%,
                #181016 22.58%,
                #181016 25.81%,
                #191016 29.03%,
                #191016 32.26%,
                #1a1117 35.48%,
                #1a1117 38.71%,
                #1b1117 41.94%,
                #1c1217 45.16%,
                #1d1218 48.39%,
                #1d1218 51.61%,
                #1f1318 54.84%,
                #201318 58.06%,
                #211418 61.29%,
                #221418 64.52%,
                #241518 67.74%,
                #261517 70.97%,
                #281617 74.19%,
                #2a1616 77.42%,
                #2c1614 80.65%,
                #2f1612 83.87%,
                #31150f 87.1%,
                #33140b 90.32%,
                #311007 93.55%,
                #290b03 96.77%,
                #170501 100%
            );
        }
    }
</style>
