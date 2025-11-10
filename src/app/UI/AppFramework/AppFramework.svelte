<script lang="ts">
    import { modeSidebarWidth } from "../../../lib/appState/modeSidebarState"

    export let hasModeSidebar = false

    $: gridColumns = hasModeSidebar
        ? `300px ${$modeSidebarWidth}px auto`
        : "300px auto"
</script>

<main id="App" style="grid-template-columns: {gridColumns};">
    <slot name="sidebar"></slot>
    {#if hasModeSidebar}
        <slot name="mode-sidebar"></slot>
    {/if}
    <slot name="content"></slot>
</main>

<style lang="scss">
    #App {
        display: grid;
        width: 100%;
        height: 100%;
        overflow: clip;
    }
</style>
