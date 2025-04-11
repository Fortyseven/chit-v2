<script>
    import { appState } from "../../../lib/appState/appState"
    import ModelSelect from "./ModelSelect.svelte"
    import SystemPrompt from "./SystemPrompt.svelte"
</script>

<div id="ChatKnobs">
    <div class="knob-container">
        {#key $appState}
            <SystemPrompt></SystemPrompt>
            <ModelSelect></ModelSelect>
        {/key}
    </div>
</div>

<style lang="scss">
    #ChatKnobs {
        display: flex;
        flex-wrap: wrap;
        height: 100%;
    }

    .knob-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        padding: 0.5rem;
        width: 100%;
        place-content: center;
        flex-direction: column;

        @media (min-width: 768px) {
            flex-direction: row;
        }
    }
</style>
