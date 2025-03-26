<script lang="ts">
    export let title: string
    export let onClick: () => void
    export let disabled: boolean
    export let iconComponent: any
    export let className: string = ""
</script>

<!-- svelte-ignore a11y_consider_explicit_label -->
<button
    class={`btn p-0 inline-flex w-8 h-8 bg-primary-500 text-white hover:bg-primary-400  disabled:opacity-50 place-content-center ${className}`}
    onclick={onClick}
    {disabled}
>
    <svelte:component this={iconComponent} {title} class="m-auto"></svelte:component>
</button>
