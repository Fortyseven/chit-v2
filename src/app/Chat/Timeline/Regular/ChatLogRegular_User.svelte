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
        width: auto;
        padding-block: 1em;
        padding-inline:0.6em;
        padding-block-start: 2em;
        color: var(--color-neutral);
        font-style: italic;
        &::before {
            content: "> ";
            font-weight: bold;
        }
    }
</style>
