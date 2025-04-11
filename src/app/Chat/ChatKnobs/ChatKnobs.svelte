<script>
    import { appState } from "../../../lib/appState/appState"
    import ModelSelect from "./ModelSelect.svelte"
    import SystemPrompt from "./SystemPrompt.svelte"
</script>

<div id="ChatKnobs">
    <div class="knob-container">
        {#key $appState}
            <ModelSelect></ModelSelect>
            <SystemPrompt></SystemPrompt>
        {/key}
    </div>
</div>

<style lang="scss">
    #ChatKnobs {
        display: flex;
        flex-wrap: wrap;
        height: 100%;
        width: fit-content;
        margin: auto;
    }

    .knob-container {
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        padding: 0.5rem;
        place-content: center;
        flex-direction: column;

        @media (min-width: 768px) {
            flex-direction: row;
        }
    }
</style>
