<script>
// @ts-nocheck

    import {
        AppBar,
        AppRail,
        AppRailAnchor,
        AppRailTile,
        AppShell,
    } from "@skeletonlabs/skeleton"

    import App_PrimaryRail from "$app/App/App_PrimaryRail.svelte"
    import Convos from "$app/Convos/Convos.svelte"

    let {children} = $props();
</script>

<AppShell>
    <!-- ---------------------------------------------------->
    <svelte:fragment slot="sidebarLeft">
        <div class="flex h-full">
            <App_PrimaryRail/>
            <Convos/>
        </div>
    </svelte:fragment>
    <!-- ---------------------------------------------------->
    <svelte:fragment slot="pageHeader">
    ZZZ
    </svelte:fragment>
    <!-- ---------------------------------------------------->
    <!-- <svelte:fragment slot="sidebarRight">
    </svelte:fragment> -->
    <!-- ---------------------------------------------------->
    <!-- (sidebarRight) -->
    <!-- Router Slot -->
    {#if children}
        {@render children()}
    {/if}
    xxx
    <!-- ---- / ---- -->
    <svelte:fragment slot="pageFooter">Page Footer</svelte:fragment>
    <!-- (footer) -->
</AppShell>

<style lang="scss">
    :global(.app-rail button) {
        border-radius: 0;
        background: transparent;
    }
</style>