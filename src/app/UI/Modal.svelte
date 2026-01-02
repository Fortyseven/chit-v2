<script>
    import { onDestroy } from "svelte"

    export let title = "Untitled Modal"
    export let open = false
    let keydownHandler

    function closePanel() {
        open = false
    }

    function handleKeydown(event) {
        if (event.key === "Escape" && open) {
            closePanel()
        }
    }

    $: {
        if (open) {
            // Add event listener when panel opens
            window.addEventListener("keydown", handleKeydown)
            keydownHandler = handleKeydown
        } else if (keydownHandler) {
            // Remove event listener when panel closes
            window.removeEventListener("keydown", keydownHandler)
        }
    }

    onDestroy(() => {
        // Clean up event listener when component is destroyed
        if (keydownHandler) {
            window.removeEventListener("keydown", keydownHandler)
        }
        open = false
    })
</script>

{#if open}
    <div class="config-panel">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="backdrop" on:click={closePanel}></div>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="modal" on:click|stopPropagation>
            <h2>{title}</h2>
            <slot></slot>
            <button on:click={closePanel} style="float: right;">Close</button>
        </div>
    </div>
{/if}

<style lang="scss">
    .config-panel {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        pointer-events: none;

        .backdrop {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            pointer-events: auto;
        }

        .modal {
            position: relative;
            background: #222;
            color: white;
            width: 80%;
            max-height: 80%;
            height: fit-content;
            max-width: 800px;
            padding: 1em;
            border-radius: var(--border-radius-standard);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow-y: auto;
            pointer-events: auto;
            box-sizing: border-box;
            outline: 2px solid #e74c3c; /* debug: make modal visually obvious */

            h2 {
                padding: 0;
                margin: 0;
                margin-bottom: 1em;
                padding-bottom: 0.5em;
                border-bottom: 1px solid #555;
            }

            @media (max-width: 768px) {
                width: 95%;
                height: 95%;
            }
        }
    }

    /* trimmed unused form-group styles to avoid warnings */
</style>
