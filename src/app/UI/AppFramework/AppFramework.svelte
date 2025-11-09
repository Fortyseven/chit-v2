<script lang="ts">
    export let hasRPSidebar = false
</script>

<main id="App" class:three-column={hasRPSidebar}>
    <slot name="sidebar"></slot>
    {#if hasRPSidebar}
        <slot name="rp-sidebar"></slot>
    {/if}
    <slot name="content"></slot>
</main>

<style lang="scss">
    #App {
        display: grid;
        grid-template-columns: 300px auto;
        width: 100%;
        height: 100%;
        overflow: none;

        &.three-column {
            grid-template-columns: 300px 250px auto;
        }
    }
</style>
