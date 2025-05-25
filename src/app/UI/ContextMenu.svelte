<script>
    import { onMount } from "svelte"
    export let open = false
    export let position = { x: 0, y: 0 }
    export let items = []
    export let onClose = () => {}

    function handleClickOutside(event) {
        const menu = document.querySelector(".context-menu")
        if (open && menu && !menu.contains(event.target)) {
            onClose()
        }
    }

    function handleEscapeKey(event) {
        if (open && event.key === "Escape") {
            onClose()
        }
    }

    onMount(() => {
        document.addEventListener("click", handleClickOutside)
        document.addEventListener("keydown", handleEscapeKey)
        return () => {
            document.removeEventListener("click", handleClickOutside)
            document.removeEventListener("keydown", handleEscapeKey)
        }
    })
</script>

{#if open}
    <div
        class="context-menu"
        style="position: fixed; left: {position.x}px; top: {position.y}px;"
    >
        {#each items as item}
            {#if item.name === "-"}
                <hr />
            {:else}
                <button on:click={item.action}>{item.name}</button>
            {/if}
        {/each}
    </div>
{/if}

<style lang="scss">
    .context-menu {
        background-color: var(--color-background);
        border-radius: var(--border-radius-standard);
        box-shadow: 0 0 10px black;
        z-index: 1000;
        padding: 0;
        font-size: 0.75em;
        padding-block: 0.5em;

        button {
            background: transparent;
            color: var(--color-accent);
            margin: 0;
            padding-block: 0.25em;
            display: block;
            width: 100%;
            text-align: left;
            font-weight: unset;

            &:hover {
                background-color: var(--color-accent);
                color: var(--color-accent-text);
            }
        }

        hr {
            border: none;
            border-top: 1px solid var(--color-accent-complement-darker);
            opacity: 0.5;
            margin: 0.5em 1em !important;
        }
    }
</style>
