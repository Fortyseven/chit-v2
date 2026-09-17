<script lang="ts">
    export let title: string
    export let onClick: (btn: HTMLButtonElement, ev: MouseEvent) => void
    export let disabled: boolean
    export let iconComponent: any
    export let className: string = ""
    export let secondary: boolean = false
    export let warning: boolean = false
    export let danger: boolean = false
    export let roundCorner = "" // can be 'ne', 'nw', 'se', 'sw' or empty
    export let size: number = 50 // button (and icon) size in px

    let buttonEl: HTMLButtonElement

    $: buttonClass =
        `${className} ${secondary ? "secondary" : ""} ${warning ? "warning" : ""} ${danger ? "danger" : ""} ${roundCorner}`.trim()
</script>

<!-- svelte-ignore a11y_consider_explicit_label -->
<button
    bind:this={buttonEl}
    onclick={(ev) => onClick(buttonEl, ev)}
    {disabled}
    class={buttonClass}
    style="width: {size}px; height: {size}px;"
>
    <svelte:component
        this={iconComponent}
        {title}
        size={Math.round(size * 0.48)}
    ></svelte:component>
</button>

<style lang="scss">
    button {
        padding: 0;
        display: inline-flex;
        border-radius: 4px;
        place-content: center;
        align-items: center;

        &:disabled {
            opacity: 0.5;
        }

        &.warning {
            background-color: orange;
        }

        &.danger {
            background-color: var(--color-error);
        }

        &.ne {
            border-radius: 0 var(--border-radius-standard) 0 0;
        }

        &.nw {
            border-radius: var(--border-radius-standard) 0 0 0;
        }

        &.se {
            border-radius: 0 0 var(--border-radius-standard) 0;
        }

        &.sw {
            border-radius: 0 0 0 var(--border-radius-standard);
        }
    }
</style>
