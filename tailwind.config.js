import { skeleton } from "@skeletonlabs/tw-plugin"
import { join } from "path"

const config = {
    darkMode: "class",
    content: [
        "./src/**/*.{html,js,svelte,ts}",
        join(
            require.resolve("@skeletonlabs/skeleton"),
            "../**/*.{html,js,svelte,ts}"
        ),
    ],

    theme: {
        extend: {},
    },

    plugins: [
        skeleton({
            themes: { preset: ["vintage"] },
        }),
    ],
}

export default config
