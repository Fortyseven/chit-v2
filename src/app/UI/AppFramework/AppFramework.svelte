<script lang="ts">
</script>

<main id="App">
    <slot name="sidebar"></slot>
    <slot name="content"></slot>
</main>

<style lang="scss">
    #App {
        display: flex;
        flex-wrap: nowrap;;
        // grid-template-columns: 1fr 1fr;
        width: 100%;
        height: 100%;
        overflow: scroll;
    }

    #App :global(> :first-child) {
        flex: 0 0 400px;
        // max-width: 400px;
    }

    #App :global(> :last-child) {
        flex: 1 1 auto;
        // width: 100%;
        // height: auto;
    }
</style>
