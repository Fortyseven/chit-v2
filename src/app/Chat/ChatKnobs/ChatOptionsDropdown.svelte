<script lang="ts">
    import { onDestroy, onMount } from "svelte"

    //TODO: convert this to a general component

    let dropdownel: HTMLElement
    let isOpen = false

    let entries = [
        { name: "Load Preset", action: () => console.log("Load Preset") },
        { name: "Save Preset", action: () => console.log("Save Preset") },
        { name: "-", action: () => {} },
        {
            name: "Refresh Model List",
            action: () => console.log("Refresh Model List"),
        },
    ]

    onMount(() => {
        document.addEventListener("click", (e) => {
            isOpen = false
        })
    })
</script>

<details
    class="dropdown dropdown-bottom"
    bind:this={dropdownel}
    bind:open={isOpen}
>
    <summary class="btn m-1">Options</summary>
    <ul
        class="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
    >
        {#each entries as { name, action }, i}
            {#if name === "-"}
                <li><hr /></li>
            {:else}
                <li>
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_missing_attribute -->
                    <a role="button" tabindex={i} onclick={action}>{name}</a>
                </li>
            {/if}
        {/each}
    </ul>
</details>

<style lang="scss">
</style>
