<script lang="ts">
    export let title: string
    export let onClick: () => void
    export let disabled: boolean
    export let iconComponent: any
    export let className: string = ""
    export let secondary: boolean = false
</script>

<!-- svelte-ignore a11y_consider_explicit_label -->
<button onclick={onClick} {disabled} class={secondary ? "secondary" : ""}>
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
    }
</style>
