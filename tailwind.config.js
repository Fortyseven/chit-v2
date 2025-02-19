import { skeleton } from "@skeletonlabs/tw-plugin"
import { chit_theme } from "./src/theme/chit-theme"

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
            themes: {
                // preset: ["vintage"],
                custom: [chit_theme],
            },
        }),
    ],
}

export default config
