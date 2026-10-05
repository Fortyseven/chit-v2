<script>
    import ConfigPanel_General from "./ConfigPanel_General.svelte"
    import ConfigPanel_General__Provider from "./ConfigPanel_General__Provider.svelte"
    import ConfigPanel_MCP from "./ConfigPanel_MCP.svelte"
    import ConfigPanel_MediaServer from "./ConfigPanel_MediaServer.svelte"
    import ConfigPanel_TTS from "./ConfigPanel_TTS.svelte"
    import ConfigPanel_Tools from "./ConfigPanel_Tools.svelte"

    import Modal from "../../UI/Modal.svelte"

    export let open = false

    let activeTab = "general"

    // Load voices when TTS tab first activated
    // $: if (
    //     open &&
    //     activeTab === "tts" &&
    //     availableVoices.length === 0 &&
    //     !loadingVoices
    // ) {
    //     // initializeOpenAIConfig()
    //     // loadVoices()
    // }
</script>

{#if open}
    <Modal title="Configuration Panel" {open}>
        <div class="tabs">
            <button
                class:active={activeTab === "general"}
                on:click={() => (activeTab = "general")}>General</button
            >
            <button
                class:active={activeTab === "provider"}
                on:click={() => (activeTab = "provider")}>Provider</button
            >
            <button
                class:active={activeTab === "mediaserver"}
                on:click={() => (activeTab = "mediaserver")}
                >Media Server</button
            >
            <button
                class:active={activeTab === "tts"}
                on:click={() => (activeTab = "tts")}>TTS</button
            >
            <button
                class:active={activeTab === "mcp"}
                on:click={() => (activeTab = "mcp")}>MCP</button
            >
            <button
                class:active={activeTab === "tools"}
                on:click={() => (activeTab = "tools")}>Tools</button
            >
        </div>

        {#if activeTab === "general"}
            <ConfigPanel_General></ConfigPanel_General>
        {/if}
        {#if activeTab === "provider"}
            <ConfigPanel_General__Provider></ConfigPanel_General__Provider>
        {/if}
        {#if activeTab === "mediaserver"}
            <ConfigPanel_MediaServer></ConfigPanel_MediaServer>
        {/if}
        {#if activeTab === "tts"}
            <ConfigPanel_TTS></ConfigPanel_TTS>
        {/if}
        {#if activeTab === "mcp"}
            <ConfigPanel_MCP></ConfigPanel_MCP>
        {/if}
        {#if activeTab === "tools"}
            <ConfigPanel_Tools></ConfigPanel_Tools>
        {/if}
    </Modal>
{/if}

<style>
    .tabs {
        display: flex;
        gap: 0.25rem;
        margin-bottom: 1rem;
        button {
            background: #111;
            background-image: linear-gradient(
                to bottom,
                #111,
                var(--color-background)
            );
            color: var(--color-accent);
            border: 1px solid #444;
            border-bottom: none;
            border-radius: var(--border-radius-standard);
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            padding: 0.5rem 0.75rem;
            cursor: pointer;
            font-weight: 600;
        }
        button.active {
            background: var(--color-background-lighter);
            background-image: linear-gradient(
                to bottom,
                var(--color-background-lighter),
                var(--color-background)
            );
            border-color: var(--color-accent-darker);
        }
    }
</style>
