import { svelte } from "@sveltejs/vite-plugin-svelte"
import tailwindcss from "@tailwindcss/vite"
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
        tailwindcss(),
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
    },
    base: "https://fortyseven.github.io/chit-v2/",
})
