<script>
    // @ts-nocheck
    import { chatSessions } from "../../stores/chatSessions.svelte.js"

    $inspect(convos)
</script>

<div class="bg-surface-900 h-full">
    {#if convos?.entries}
        <div class="flex flex-col gap-4 w-full max-w-[800px] m-auto">
            {#each convos.entries[$currentChatSessionIndex].chatState.timeline as timeline_entry, i}
                {#if timeline_entry.role === "assistant"}
                    <div
                        class="flex gap-4 place-items-center bg-primary-900 rounded-xl w-[90%] shadow-2xl"
                    >
                        <div
                            class="flex-auto card p-4 variant-soft rounded-tl-none space-y-2"
                        >
                            <p>{timeline_entry.text}</p>
                        </div>
                        <div
                            class="flex-[64px] grow-0 shrink-0 place-content-center"
                        >
                            <Avatar
                                src={`https://i.pravatar.cc/?img={${timeline_entry.role}}`}
                                class="w-full"
                            />
                        </div>
                    </div>
                {:else}
                    <div
                        class="flex gap-4 place-items-center bg-secondary-900 rounded-xl w-[90%] ml-auto shadow-2xl"
                    >
                        {@render avatar(timeline_entry.role)}
                        <div
                            class="flex-auto card p-4 variant-soft rounded-tl-none space-y-2"
                        >
                            <p>{timeline_entry.text}</p>
                        </div>
                    </div>
                {/if}
            {/each}
        </div>
    {/if}
</div>
