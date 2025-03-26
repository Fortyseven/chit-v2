<script lang="ts">
    import { Gears } from "carbon-icons-svelte"
    import { onMount } from "svelte"
    import { chatGenerateTitle } from "../../../lib/chatSession/chatTitler"
    import { loadPresetFromFile } from "../../../lib/presets/presets"

    //TODO: convert this to a general component

    let dropdownel: HTMLElement
    let isOpen = false

    let entries = [
        { name: "Load Preset", action: onLoadPreset },
        { name: "Save Preset", action: () => console.log("Save Preset") },
        { name: "-", action: () => {} },
        { name: "Reroll chat title", action: () => chatGenerateTitle() },
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

    function onLoadPreset() {
        loadPresetFromFile()
    }
</script>

<details
    class="dropdown dropdown-top dropdown-end"
    bind:this={dropdownel}
    bind:open={isOpen}
>
    <summary class="btn bg-secondary-300 text-black min-h-0 h-8 p-0 w-8">
        <Gears className=""/>
    </summary>
    <ul
        class="dropdown-content menu bg-base-100 rounded-box z-[1] w-48 p-2 shadow-xs"
    >
        {#each entries as { name, action }, i}
            {#if name === "-"}
                <li><hr class="" /></li>
            {:else}
                <li>
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_missing_attribute -->
                    <a
                        role="button"
                        class="text-primary-500"
                        tabindex={i}
                        onclick={action}>{name}</a
                    >
                </li>
            {/if}
        {/each}
    </ul>
</details>

<style lang="scss">
    hr {
        border: 1px solid var(--color-surface-500) !important;
        height: 0px !important;
        width: 100%;
        margin: auto;
        padding: 0;
    }
</style>
