<script>
    import MarkdownIt from "markdown-it"
    import { hljs } from "../../../../vendor/highlight.min"

    const md = MarkdownIt({
        highlight: function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    const hl = hljs.highlight(str, { language: lang }).value
                    return hl
                } catch (__) {}
            }

            return "" // use external default escaping
        },
    })

    export let line = { role: "assistant", content: "🍆" }

    let processedContent = md.render(line || "No line??? [Chit error.]").trim()
</script>

<div class="response markdown bot">
    {@html processedContent}
</div>

<style lang="scss">
    .response {
        border-radius: 0.5em;
        box-shadow: 0 0.25em 0.25em 0 #000;
        text-align: start;
        padding: 1em;
        font-size: 1.1em;
        background-color: #0008;
        width: 100%;

        // background-image: linear-gradient(
        //     140deg,
        //     #3330 0%,
        //     rgba(0, 0, 0, 0.8) 100%
        // );

        border-bottom: 1px solid #fff1;
        border-top: 1px solid #fff2;
        // border-top-left-radius: unset;
        color: var(--color-primary-300);
        backdrop-filter: blur(3px) brightness(140%);

        // max-width: 1024px;
        margin: auto;
    }
</style>
