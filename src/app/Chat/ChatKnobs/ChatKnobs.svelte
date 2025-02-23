<script>
    import { appState } from "../../../appState/appState"
    import ChatOptionsDropdown from "./ChatOptionsDropdown.svelte"
    import ModelSelect from "./ModelSelect.svelte"
    import SystemPrompt from "./SystemPrompt.svelte"
</script>

<div id="ChatKnobs" class="flex flex-wrap h-full">
    <div
        class="flex flex-wrap gap-2 px-2 py-2 w-full place-content-center flex-col md:flex-row"
    >
        {#key $appState}
            <SystemPrompt></SystemPrompt>
            <ModelSelect></ModelSelect>
            <ChatOptionsDropdown></ChatOptionsDropdown>
        {/key}
    </div>
</div>

<style lang="scss">
</style>
