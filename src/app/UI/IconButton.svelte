<script lang="ts">
    export let title: string
    export let onClick: (btn: HTMLButtonElement, ev: MouseEvent) => void
    export let disabled: boolean
    export let iconComponent: any
    export let className: string = ""
    export let secondary: boolean = false
    export let warning: boolean = false
    export let roundCorner = "" // can be 'ne', 'nw', 'se', 'sw' or empty

    let buttonEl: HTMLButtonElement

    $: buttonClass =
        `${className} ${secondary ? "secondary" : ""} ${warning ? "warning" : ""} ${roundCorner}`.trim()
</script>

<!-- svelte-ignore a11y_consider_explicit_label -->
<button
    bind:this={buttonEl}
    onclick={(ev) => onClick(buttonEl, ev)}
    {disabled}
    class={buttonClass}
>
    <svelte:component this={iconComponent} {title}></svelte:component>
</button>

<style lang="scss">
    button {
        padding: 0;
        display: inline-flex;
        border-radius: 0px;
        width: 50px;
        height: 50px;
        place-content: center;
        align-items: center;

        &:disabled {
            opacity: 0.5;
        }

        &.warning {
            background-color: orange;
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
