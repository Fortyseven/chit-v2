<script lang="ts">
    import Status__Counter from "./Status__Counter.svelte"

    export let inputLength = 0
</script>

<div class="status-bar">
    <div class="left"></div>
    <div class="center">
        <Status__Counter {inputLength} />
    </div>
    <div class="right"></div>
</div>

<style lang="scss">
    .status-bar {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        background: linear-gradient(to bottom, transparent 0%, #0004 100%);
        height: 1em;
        padding-block: 0.5em;
        padding-inline: 1em;
        color: white;
        max-width: var(--timeline-max-width);
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
</style>
