<script lang="ts">
</script>

<main id="App">
    <slot name="sidebar"></slot>
    <slot name="content"></slot>
</main>

<style lang="scss">
    #App {
        display: grid;
        grid-template-columns: 300px auto;
        width: 100%;
        height: 100%;
        overflow: none;
    }

    #App :global(> :first-child) {
        //
    }

    #App :global(> :last-child) {
        //
    }
</style>
