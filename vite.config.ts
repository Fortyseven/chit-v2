import { svelte } from "@sveltejs/vite-plugin-svelte"
import path from "path"
import { defineConfig } from "vite"

const IGNORED_WARNINGS = [
    "a11y-autofocus",
    "a11y-click-events-have-key-events",
    "a11y-label-has-associated-control",
    "a11y-missing-attribute",
    "a11y-no-noninteractive-element-interactions",
    "a11y-no-static-element-interactions",
    "css-unused-selector",
]

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        svelte({
            compilerOptions: {
                runes: false,
            },
            onwarn(warning, handler) {
                if (!IGNORED_WARNINGS.includes(warning.code)) handler(warning)
            },
        }),
    ],
    resolve: {
        alias: {
            "@": path.resolve("./src"),
            $src: path.resolve("./src"),
            $lib: path.resolve("./src/lib"),
            $stores: path.resolve("./src/stores"),
            $app: path.resolve("./src/app"),
        },
    },
    build: {
        target: "ES2022",
        // The main bundle is ~1.5 MB because the markdown rendering stack
        // (KaTeX, markdown-it, highlight.js) must load upfront to render
        // assistant messages. Mermaid and the MCP SDK are code-split and
        // load lazily. Raise the limit to acknowledge this deliberate size
        // instead of warning on every build.
        chunkSizeWarningLimit: 1600,
    },
    base: "https://fortyseven.github.io/chit-v2/",
})
