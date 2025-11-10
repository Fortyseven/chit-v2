<script lang="ts">
    export let hasModeSidebar = false
</script>

<main id="App" class:three-column={hasModeSidebar}>
    <slot name="sidebar"></slot>
    {#if hasModeSidebar}
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
