<script lang="ts">
    import { Gears } from "carbon-icons-svelte"
    import { onMount } from "svelte"
    import { chatGenerateTitle } from "../../../lib/chatSession/chatTitler"
    import { loadPresetFromFile } from "../../../lib/presets/presets"

    //TODO: convert this to a general component

    let dropdownel: HTMLElement
    let isOpen = false

    let entries = [
        { name: "Load Preset", action: onLoadPreset },
        { name: "Save Preset", action: () => console.log("Save Preset") },
        { name: "-", action: () => {} },
        { name: "Reroll chat title", action: () => chatGenerateTitle() },
        { name: "-", action: () => {} },
        {
            name: "Refresh Model List",
            action: () => console.log("Refresh Model List"),
        },
    ]

    onMount(() => {
        document.addEventListener("click", (e) => {
            isOpen = false
        })
    })

    function onLoadPreset() {
        loadPresetFromFile()
    }
</script>

<details
    class="dropdown dropdown-top dropdown-end"
    bind:this={dropdownel}
    bind:open={isOpen}
>
    <summary class="btn">
        <Gears className="" />
    </summary>
    <ul class="dropdown-content menu">
        {#each entries as { name, action }, i}
            {#if name === "-"}
                <li><hr class="" /></li>
            {:else}
                <li>
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_missing_attribute -->
                    <a role="button" tabindex={i} onclick={action}>{name}</a>
                </li>
            {/if}
        {/each}
    </ul>
</details>

<style lang="scss">
    summary {
        background-color: var(--color-secondary-300);
        color: var(--color-black);
        min-height: calc(var(--spacing) * 0);
        height: calc(var(--spacing) * 8);
        padding: calc(var(--spacing) * 0);
        width: calc(var(--spacing) * 8);
    }

    ul {
        background-color: var(--color-base-100);
        border-radius: var(--radius-box);
        z-index: 1;

        width: calc(var(--spacing) * 48);
        padding: calc(var(--spacing) * 2);
        box-shadow: 0 0 10px red;
    }

    .dropdown {
        position: relative;
        display: inline-block;
        position-area: var(--anchor-v, bottom) var(--anchor-h, span-right);
        & > *:not(summary):focus {
            --tw-outline-style: none;
            outline-style: none;
            @media (forced-colors: active) {
                outline: 2px solid transparent;
                outline-offset: 2px;
            }
        }
        .dropdown-content {
            position: absolute;
        }
        &:not(details, .dropdown-open, .dropdown-hover:hover, :focus-within) {
            .dropdown-content {
                display: none;
                transform-origin: top;
                opacity: 0%;
                scale: 95%;
            }
        }
        &[popover],
        .dropdown-content {
            z-index: 999;
            animation: dropdown 0.2s;
            transition-property: opacity, scale, display;
            transition-behavior: allow-discrete;
            transition-duration: 0.2s;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        @starting-style {
            &[popover],
            .dropdown-content {
                scale: 95%;
                opacity: 0;
            }
        }
        &.dropdown-open,
        &:not(.dropdown-hover):focus,
        &:focus-within {
            > [tabindex]:first-child {
                pointer-events: none;
            }
            .dropdown-content {
                opacity: 100%;
            }
        }
        &.dropdown-hover:hover {
            .dropdown-content {
                opacity: 100%;
                scale: 100%;
            }
        }
        &:is(details) {
            summary {
                &::-webkit-details-marker {
                    display: none;
                }
            }
        }
        &.dropdown-open,
        &:focus,
        &:focus-within {
            .dropdown-content {
                scale: 100%;
            }
        }
        &:where([popover]) {
            background: #0000;
        }
        &[popover] {
            position: fixed;
            color: inherit;
            @supports not (position-area: bottom) {
                margin: auto;
                &.dropdown-open:not(:popover-open) {
                    display: none;
                    transform-origin: top;
                    opacity: 0%;
                    scale: 95%;
                }
                &::backdrop {
                    background-color: color-mix(in oklab, #000 30%, #0000);
                }
            }
            &:not(.dropdown-open, :popover-open) {
                display: none;
                transform-origin: top;
                opacity: 0%;
                scale: 95%;
            }
        }
    }

    .dropdown-top {
        --anchor-v: top;
        .dropdown-content {
            top: auto;
            bottom: 100%;
            transform-origin: bottom;
        }
    }

    .dropdown-end {
        --anchor-h: span-left;
        :where(.dropdown-content) {
            inset-inline-end: calc(0.25rem /* 4px */ * 0) /* 0rem = 0px */;
            translate: 0 0;
        }
        &.dropdown-left {
            --anchor-h: left;
            --anchor-v: span-top;
            .dropdown-content {
                top: auto;
                bottom: calc(0.25rem /* 4px */ * 0) /* 0rem = 0px */;
            }
        }
        &.dropdown-right {
            --anchor-h: right;
            --anchor-v: span-top;
            .dropdown-content {
                top: auto;
                bottom: calc(0.25rem /* 4px */ * 0) /* 0rem = 0px */;
            }
        }
    }

    .btn {
        :where(&) {
            width: unset;
        }
        display: inline-flex;
        flex-shrink: 0;
        cursor: pointer;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: center;
        gap: calc(0.25rem /* 4px */ * 1.5) /* 0.375rem = 6px */;
        text-align: center;
        vertical-align: middle;
        outline-offset: 2px;
        webkit-user-select: none;
        user-select: none;
        padding-inline: var(--btn-p);
        color: var(--btn-fg);
        --tw-prose-links: var(--btn-fg);
        height: var(--size);
        font-size: var(--fontsize, 0.875rem /* 14px */);
        font-weight: 600;
        outline-color: var(
            --btn-color,
            var(--color-base-content) /* var(--color-base-content) */
        );
        transition-property: color, background-color, border-color, box-shadow;
        transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
        transition-duration: 0.2s;
        border-start-start-radius: var(
            --join-ss,
            var(--radius-field) /* var(--radius-field) */
        );
        border-start-end-radius: var(
            --join-se,
            var(--radius-field) /* var(--radius-field) */
        );
        border-end-start-radius: var(
            --join-es,
            var(--radius-field) /* var(--radius-field) */
        );
        border-end-end-radius: var(
            --join-ee,
            var(--radius-field) /* var(--radius-field) */
        );
        background-color: var(--btn-bg);
        background-size: auto, calc(var(--noise) * 100%);
        background-image: none, var(--btn-noise);
        border-width: var(--border);
        border-style: solid;
        border-color: var(--btn-border);
        text-shadow: 0 0.5px oklch(100% 0 0 / calc(var(--depth) * 0.15));
        box-shadow:
            0 0.5px 0 0.5px oklch(100% 0 0 / calc(var(--depth) * 6%)) inset,
            var(--btn-shadow);
        --size: calc(var(--size-field, 0.25rem /* 4px */) * 10);
        --btn-bg: var(
            --btn-color,
            var(--color-base-200) /* var(--color-base-200) */
        );
        --btn-fg: var(--color-base-content) /* var(--color-base-content) */;
        --btn-p: 1rem /* 16px */;
        --btn-border: color-mix(
            in oklab,
            var(--btn-bg),
            #000 calc(var(--depth) * 5%)
        );
        --btn-shadow: 0 3px 2px -2px color-mix(in oklab, var(--btn-bg)
                        calc(var(--depth) * 30%), #0000),
            0 4px 3px -2px color-mix(in oklab, var(--btn-bg)
                        calc(var(--depth) * 30%), #0000);
        --btn-noise: var(--fx-noise);
        .prose & {
            text-decoration-line: none;
        }
        @media (hover: hover) {
            &:hover {
                --btn-bg: color-mix(
                    in oklab,
                    var(
                        --btn-color,
                        var(--color-base-200) /* var(--color-base-200) */
                    ),
                    #000 7%
                );
            }
        }
        &:focus-visible {
            outline-width: 2px;
            outline-style: solid;
        }
        &:active:not(.btn-active) {
            translate: 0 0.5px;
            --btn-bg: color-mix(
                in oklab,
                var(
                    --btn-color,
                    var(--color-base-200) /* var(--color-base-200) */
                ),
                #000 5%
            );
            --btn-border: color-mix(
                in oklab,
                var(
                    --btn-color,
                    var(--color-base-200) /* var(--color-base-200) */
                ),
                #000 7%
            );
            --btn-shadow: 0 0 0 0 oklch(0% 0 0/0), 0 0 0 0 oklch(0% 0 0/0);
        }
        &:is(:disabled, [disabled], .btn-disabled) {
            &:not(.btn-link, .btn-ghost) {
                background-color: color-mix(
                    in oklab,
                    var(--color-base-content) /* var(--color-base-content) */
                        10%,
                    transparent
                );
                box-shadow: none;
            }
            pointer-events: none;
            --btn-border: #0000;
            --btn-noise: none;
            --btn-fg: color-mix(
                in oklch,
                var(--color-base-content) /* var(--color-base-content) */ 20%,
                #0000
            );
            @media (hover: hover) {
                &:hover {
                    pointer-events: none;
                    background-color: color-mix(
                        in oklab,
                        var(--color-neutral) /* var(--color-neutral) */ 20%,
                        transparent
                    );
                    --btn-border: #0000;
                    --btn-fg: color-mix(
                        in oklch,
                        var(--color-base-content)
                            /* var(--color-base-content) */ 20%,
                        #0000
                    );
                }
            }
        }
        &:is(input[type="checkbox"], input[type="radio"]) {
            appearance: none;
            &::after {
                content: attr(aria-label);
            }
        }
        &:where(input:checked:not(.filter .btn)) {
            --btn-color: var(--color-primary) /* var(--color-primary) */;
            --btn-fg: var(--color-primary-content)
                /* var(--color-primary-content) */;
            isolation: isolate;
        }
    }

    .menu {
        display: flex;
        width: fit-content;
        flex-direction: column;
        flex-wrap: wrap;
        padding: calc(0.25rem /* 4px */ * 2) /* 0.5rem = 8px */;
        --menu-active-fg: var(--color-neutral-content)
            /* var(--color-neutral-content) */;
        --menu-active-bg: var(--color-neutral) /* var(--color-neutral) */;
        font-size: 0.875rem /* 14px */;
        :where(li ul) {
            position: relative;
            margin-inline-start: calc(0.25rem /* 4px */ * 4) /* 1rem = 16px */;
            padding-inline-start: calc(0.25rem /* 4px */ * 2) /* 0.5rem = 8px */;
            white-space: nowrap;
            &:before {
                position: absolute;
                inset-inline-start: calc(0.25rem /* 4px */ * 0) /* 0rem = 0px */;
                top: calc(0.25rem /* 4px */ * 3) /* 0.75rem = 12px */;
                bottom: calc(0.25rem /* 4px */ * 3) /* 0.75rem = 12px */;
                background-color: var(--color-base-content)
                    /* var(--color-base-content) */;
                opacity: 10%;
                width: var(--border);
                content: "";
            }
        }
        :where(li > .menu-dropdown:not(.menu-dropdown-show)) {
            display: none;
        }
        :where(li:not(.menu-title) > *:not(ul, details, .menu-title, .btn)),
        :where(li:not(.menu-title) > details > summary:not(.menu-title)) {
            display: grid;
            grid-auto-flow: column;
            align-content: flex-start;
            align-items: center;
            gap: calc(0.25rem /* 4px */ * 2) /* 0.5rem = 8px */;
            border-radius: var(--radius-field) /* var(--radius-field) */;
            padding-inline: calc(0.25rem /* 4px */ * 3) /* 0.75rem = 12px */;
            padding-block: calc(0.25rem /* 4px */ * 1.5) /* 0.375rem = 6px */;
            text-align: start;
            transition-property: color, background-color, box-shadow;
            transition-duration: 0.2s;
            transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
            grid-auto-columns: minmax(auto, max-content) auto max-content;
            text-wrap: balance;
            user-select: none;
        }
        :where(li > details > summary) {
            --tw-outline-style: none;
            outline-style: none;
            @media (forced-colors: active) {
                outline: 2px solid transparent;
                outline-offset: 2px;
            }
            &::-webkit-details-marker {
                display: none;
            }
        }
        :where(li > details > summary),
        :where(li > .menu-dropdown-toggle) {
            &:after {
                justify-self: flex-end;
                display: block;
                height: 0.375rem /* 6px */;
                width: 0.375rem /* 6px */;
                rotate: -135deg;
                translate: 0 -1px;
                transition-property: rotate, translate;
                transition-duration: 0.2s;
                content: "";
                transform-origin: 50% 50%;
                box-shadow: 2px 2px inset;
                pointer-events: none;
            }
        }
        :where(li > details[open] > summary):after,
        :where(li > .menu-dropdown-toggle.menu-dropdown-show):after {
            rotate: 45deg;
            translate: 0 1px;
        }
        :where(
                li:not(.menu-title, .disabled)
                    > *:not(ul, details, .menu-title),
                li:not(.menu-title, .disabled)
                    > details
                    > summary:not(.menu-title)
            ):not(.menu-active, :active, .btn) {
            &.menu-focus,
            &:focus-visible {
                cursor: pointer;
                background-color: color-mix(
                    in oklab,
                    var(--color-base-content) /* var(--color-base-content) */
                        10%,
                    transparent
                );
                color: var(--color-base-content) /* var(--color-base-content) */;
                --tw-outline-style: none;
                outline-style: none;
                @media (forced-colors: active) {
                    outline: 2px solid transparent;
                    outline-offset: 2px;
                }
            }
        }
        :where(
                li:not(.menu-title, .disabled)
                    > *:not(ul, details, .menu-title):not(
                        .menu-active,
                        :active,
                        .btn
                    ):hover,
                li:not(.menu-title, .disabled)
                    > details
                    > summary:not(.menu-title):not(
                        .menu-active,
                        :active,
                        .btn
                    ):hover
            ) {
            cursor: pointer;
            background-color: color-mix(
                in oklab,
                var(--color-base-content) /* var(--color-base-content) */ 10%,
                transparent
            );
            --tw-outline-style: none;
            outline-style: none;
            @media (forced-colors: active) {
                outline: 2px solid transparent;
                outline-offset: 2px;
            }
            box-shadow:
                0 1px oklch(0% 0 0 / 0.01) inset,
                0 -1px oklch(100% 0 0 / 0.01) inset;
        }
        :where(li:empty) {
            background-color: var(--color-base-content)
                /* var(--color-base-content) */;
            opacity: 10%;
            margin: 0.5rem /* 8px */ 1rem /* 16px */;
            height: 1px;
        }
        :where(li) {
            position: relative;
            display: flex;
            flex-shrink: 0;
            flex-direction: column;
            flex-wrap: wrap;
            align-items: stretch;
            .badge {
                justify-self: flex-end;
            }
            & > *:not(ul, .menu-title, details, .btn):active,
            & > *:not(ul, .menu-title, details, .btn).menu-active,
            & > details > summary:active {
                --tw-outline-style: none;
                outline-style: none;
                @media (forced-colors: active) {
                    outline: 2px solid transparent;
                    outline-offset: 2px;
                }
                color: var(--menu-active-fg);
                background-color: var(--menu-active-bg);
                background-size: auto, calc(var(--noise) * 100%);
                background-image: none, var(--fx-noise);
                &:not(&:active) {
                    box-shadow: 0 2px calc(var(--depth) * 3px) -2px var(--menu-active-bg);
                }
            }
            &.menu-disabled {
                pointer-events: none;
                color: color-mix(
                    in oklab,
                    var(--color-base-content) /* var(--color-base-content) */
                        20%,
                    transparent
                );
            }
        }
        .dropdown:focus-within {
            .menu-dropdown-toggle:after {
                rotate: 45deg;
                translate: 0 1px;
            }
        }
        .dropdown-content {
            margin-top: calc(0.25rem /* 4px */ * 2) /* 0.5rem = 8px */;
            padding: calc(0.25rem /* 4px */ * 2) /* 0.5rem = 8px */;
            &:before {
                display: none;
            }
        }
    }

    hr {
        border: 1px solid var(--color-surface-500) !important;
        height: 0px !important;
        width: 100%;
        margin: auto;
        padding: 0;
    }
</style>
