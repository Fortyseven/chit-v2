import { svelte } from "@sveltejs/vite-plugin-svelte"
import path from "path"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
    plugins: [svelte()],
    resolve: {
        alias: {
            "@": path.resolve("./src"),
            $src: path.resolve("./src"),
            $lib: path.resolve("./src/lib"),
            $stores: path.resolve("./src/stores"),
            $app: path.resolve("./src/app"),
        },
    },
})
