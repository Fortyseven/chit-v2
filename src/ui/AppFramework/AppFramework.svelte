<script lang="ts">
</script>

<main id="App">
    <slot name="sidebar"></slot>
    <slot name="content"></slot>
</main>

<style lang="scss">
    #App {
        display: grid;
        grid-template-columns: auto 1fr;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
    }

    #App :global(> :first-child) {
        max-width: 400px;
        border: 1px solid red;
        background: var(--color-amber-300) !important;
    }

    #App :global(> :last-child) {
        width: 100%;
        height: auto;
        border: 1px dashed red;
    }
</style>
