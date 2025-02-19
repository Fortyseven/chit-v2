<script>
    import { derived } from "svelte/store"

    export let line = { role: "user", content: "🍆" }

    const MAX_LINE_LENGTH = 512

    function getLine() {
        return (
            line.substr(0, MAX_LINE_LENGTH) +
            (line.length > MAX_LINE_LENGTH ? "&hellip;" : "")
        )
    }
</script>

<div class="response user">
    {@html getLine()}
</div>

<style lang="scss">
    .response {
        // border: 1px solid red;
        border-radius: 0.5em;
        // background-color: #fff1;
        text-align: start;
        padding: 1em;

        color: rgb(var(--color-surface-300));
        flex: 0 1 auto;
        // font-size: 1.1em;
        font-style: italic;
        line-height: 1.35em;
        overflow: scroll;
        width: 100%;
        &::before {
            content: "> ";
            font-weight: bold;
        }
        opacity: 0.75;
    }
</style>
