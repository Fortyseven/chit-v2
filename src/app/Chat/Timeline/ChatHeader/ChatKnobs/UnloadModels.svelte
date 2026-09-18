<script lang="ts">
    import IconButton from "$app/UI/IconButton.svelte"
    import { llm } from "$lib/llm/llm"
    import toast, { toastError } from "$lib/toast"
    import { Eject } from "svelte-google-materialdesign-icons"

    let unloading = false

    async function onUnload() {
        unloading = true
        try {
            await $llm.unloadAllModels()
            toast("Unloaded all models")
        } catch (e) {
            toastError(e instanceof Error ? e.message : "Failed to unload models")
        } finally {
            unloading = false
        }
    }
</script>

<div class="unload-models">
    <IconButton
        title="Unload all models"
        onClick={onUnload}
        iconComponent={Eject}
        disabled={unloading}
        size={28}
    />
</div>

<style lang="scss">
    .unload-models {
        display: flex;
        align-items: center;
    }
</style>
