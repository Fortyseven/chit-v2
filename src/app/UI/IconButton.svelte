<script lang="ts">
    export let title: string
    export let onClick: () => void
    export let disabled: boolean
    export let iconComponent: any
    export let className: string = ""
</script>

<!-- svelte-ignore a11y_consider_explicit_label -->
<button
    onclick={onClick}
    {disabled}
>
    <svelte:component this={iconComponent} {title} class="m-auto"></svelte:component>
</button>

<style lang="scss">

    button {
        padding: 0;
        display: inline-flex;
        width: 8px;
        height: 8px;
        background-color: var(--color-primary-500);
        color: white;
        place-content: center;

        &:disabled {
            opacity: 0.5;
        }
    }

</style>
