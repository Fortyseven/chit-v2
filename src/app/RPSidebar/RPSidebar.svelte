<script lang="ts">
    import RPModePanel from "../ChatSidebar/ModePanels/RPModePanel.svelte"
</script>

<div id="RPSidebar">
    <div class="rp-content">
        <RPModePanel />
    </div>
</div>

<style lang="scss">
    #RPSidebar {
        height: 100%;
        background-color: var(--color-background);
        border-right: 1px solid var(--color-border, #333);
        box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
        position: relative;
        z-index: 50;

        // RP mode specific styling
        background-color: color-mix(
            in srgb,
            var(--color-background) 95%,
            var(--color-accent-complement) 5%
        );
        border-right-color: var(--color-accent-complement);

        .rp-content {
            padding: 1em;
            height: 100%;
            overflow-y: auto;
        }
    }
</style>
