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

<style>
    .config-panel {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
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

    :global(.form-group) {
        margin-bottom: 1rem;

        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
        }

        input[type="text"] {
            width: 100%;
            padding: 0.5em;
            border-radius: var(--border-radius-standard);
            border: 1px solid #555;
            background-color: #444;
            color: white;
            font-family: monospace;
            box-sizing: border-box;
        }

        textarea {
            width: 100%;
            padding: 0.5em;
            border-radius: var(--border-radius-standard);
            border: 1px solid #555;
            background-color: #444;
            color: white;
            resize: vertical;
            box-sizing: border-box;
            font-family: monospace;
        }

        input[type="checkbox"] {
            margin-right: 0.5rem;
        }
    }
</style>
