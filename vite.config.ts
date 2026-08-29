import { svelte } from "@sveltejs/vite-plugin-svelte"
import path from "path"
import { defineConfig } from "vite"

// Svelte warning codes use underscores (not hyphens) — see svelte.dev/e
const IGNORED_WARNINGS = [
    "a11y_autofocus",
    "a11y_click_events_have_key_events",
    "a11y_label_has_associated_control",
    "a11y_missing_attribute",
    "a11y_no_noninteractive_element_interactions",
    "a11y_no_static_element_interactions",
    "css_unused_selector",
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
