<script>
    import { createEventDispatcher } from "svelte"

    // Props for customizing the pill
    export let text = "" // Text to display in the pill
    export let tooltipPosition = "above" // 'above' or 'below'
    export let backgroundColor = "#e0e0e0" // Default light gray background
    export let textColor = "#333" // Default text color
    export let color = "" // Hex color value (will override backgroundColor if provided)
    export let dismissible = false // Whether to show an X button to dismiss the pill
    export let enableTooltip = false // Whether to show a tooltip

    // Internal state
    let showTooltip = true
    let pillElement

    const dispatch = createEventDispatcher()

    function handleMouseEnter() {
        showTooltip = true
    }

    function handleMouseLeave() {
        showTooltip = false
    }

    function handleClick() {
        dispatch("click")
    }

    function handleDismiss(e) {
        e.stopPropagation() // Prevent triggering the pill click event
        dispatch("dismiss")
    }

    // Use color prop if provided, otherwise use backgroundColor
    $: bgColor = color || backgroundColor
</script>

<div class="pill-container" bind:this={pillElement}>
    <button
        class="pill small"
        aria-label={text}
        tabindex="0"
        style:background-color={bgColor}
        style:color={textColor}
        on:mouseenter={handleMouseEnter}
        on:mouseleave={handleMouseLeave}
        on:click={handleClick}
    >
        <span class="pill-text">{text}</span>
        {#if dismissible}
            <!-- svelte-ignore node_invalid_placement_ssr -->
            <button
                class="dismiss-button"
                on:click={handleDismiss}
                aria-label="Dismiss"
            >
                ×
            </button>
        {/if}
    </button>

    {#if enableTooltip && showTooltip && $$slots.default}
        <div
            class="tooltip"
            class:above={tooltipPosition === "above"}
            class:below={tooltipPosition === "below"}
        >
            <slot />
        </div>
    {/if}
</div>

<style>
    .pill-container {
        display: inline-block;
        position: relative;
        width: 100%;
    }

    .pill {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        font-size: 0.7rem;
        padding: 2px 8px;
        white-space: nowrap;
        cursor: pointer;
        user-select: none;
        font-weight: normal;
        transition: opacity 0.2s ease;
        cursor: pointer;
        width: 100%;
    }

    .pill-text {
        margin-right: var(--dismiss-margin, 0);
    }

    .dismiss-button {
        background: none;
        border: none;
        color: inherit;
        font-size: 0.9rem;
        line-height: 0.7;
        padding: 0 0 0 4px;
        cursor: pointer;
        opacity: 0.7;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 2px;
        font-weight: bold;
        color: black;
    }

    .dismiss-button:hover {
        opacity: 1;
    }

    .pill:hover {
        opacity: 0.9;
    }

    .tooltip {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        padding: 6px 10px;
        border-radius: var(--border-radius-standard);
        background-color: rgba(0, 0, 0, 0.85);
        color: #fff;
        font-size: 0.8rem;
        white-space: nowrap;
        pointer-events: none;
        z-index: 1000;
        min-width: max-content;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        animation: fadeIn 0.2s ease-out;
    }

    .tooltip.above {
        bottom: 100%;
        margin-bottom: 8px;
    }

    .tooltip.below {
        top: 100%;
        margin-top: 8px;
    }

    .tooltip:after {
        content: "";
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        border-width: 5px;
        border-style: solid;
    }

    .tooltip.above:after {
        top: 100%;
        border-color: rgba(0, 0, 0, 0.85) transparent transparent transparent;
    }

    .tooltip.below:after {
        bottom: 100%;
        border-color: transparent transparent rgba(0, 0, 0, 0.85) transparent;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
</style>
