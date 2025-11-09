<script lang="ts">
    import BackpackIndicator from "./Status__BackpackIndicator.svelte"
    import Status__Counter from "./Status__Counter.svelte"
    import ModeSelector from "./Status__ModeSelector.svelte"
    import RequestTimer from "./Status__RequestTimer.svelte"

    export let inputLength = 0
</script>

<div class="status-bar">
    <div class="wrapper">
        <div class="left">
            <ModeSelector />
        </div>
        <div class="center">
            <Status__Counter {inputLength} />
        </div>
        <div class="right">
            <RequestTimer />
            <BackpackIndicator />
        </div>
    </div>
</div>

<style lang="scss">
    .status-bar {
        background: linear-gradient(to bottom, transparent 0%, #0004 100%);
        height: 1em;
        padding-block: 0.5em;
        padding-inline: 1em;
        .wrapper {
            max-width: var(--timeline-max-width);
            width: 100%;
            margin: auto;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            color: white;

            .left,
            .right,
            .center {
                width: 100%;
                display: flex;
            }
            .left {
                justify-content: start;
            }
            .center {
                justify-content: center;
            }
            .right {
                justify-content: end;
            }
        }
    }
</style>
