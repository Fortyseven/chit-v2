<script lang="ts">
    import { Gears } from "carbon-icons-svelte"
    import { onMount } from "svelte"
    import { chatInProgress } from "../../../lib/chatSession/chatActions"
    import { chatGenerateTitle } from "../../../lib/chatSession/chatTitler"
    import { loadPresetFromFile } from "../../../lib/presets/presets"
    import IconButton from "../../UI/IconButton.svelte"

    //TODO: convert this to a general component

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

<IconButton
    title="Chat Options"
    onClick={() => (isOpen = !isOpen)}
    iconComponent={Gears}
    secondary
    disabled={$chatInProgress}
    className="btn-preset"
    roundCorner="ne"
/>

<style lang="scss">
</style>
