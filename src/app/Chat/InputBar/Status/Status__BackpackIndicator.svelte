<script lang="ts">
    import { FlashFilled, FlashOffFilled } from "carbon-icons-svelte"
    import { appState } from "../../../../lib/appState/appState"
    import { chatSetBackpackMode } from "../../../../lib/chatSession/chatActions"
    import {
        BackpackMode,
        currentChat,
    } from "../../../../lib/chatSession/chatSession"
    import ContextMenu from "../../../UI/ContextMenu.svelte"

    const LIVE_INTERVAL = 10000
    const RETRY_INTERVAL = 2000

    let backpackAlive = false
    let backpackAdaptiveInterval = RETRY_INTERVAL
    let backpackModeId = BackpackMode.OFF

    let backpackModeOpen = false

    const checkBackpack = async () => {
        if ($appState.backpackApiEndpoint) {
            try {
                const response = await fetch(
                    `${$appState.backpackApiEndpoint}/api/health`,
                )
                backpackAlive = response.ok
                backpackAdaptiveInterval = LIVE_INTERVAL
            } catch (error) {
                backpackAdaptiveInterval = RETRY_INTERVAL
                backpackAlive = false
            } finally {
                if ($appState.backpackHeartbeatTimer) {
                    clearTimeout($appState.backpackHeartbeatTimer)
                }
                $appState.backpackHeartbeatTimer = setTimeout(() => {
                    checkBackpack()
                }, backpackAdaptiveInterval)
            }
        }
    }
    checkBackpack()

    function changeMode(backpackMode: BackpackMode) {
        chatSetBackpackMode(backpackMode)
        backpackModeOpen = false
    }

    $: backpackModeId = $currentChat?.backpackMode || BackpackMode.OFF
</script>

<div class="status-backpack">
    {#if $appState.backpackApiEndpoint}
        <div>{backpackModeId}</div>
        <div>
            <FlashFilled
                color={backpackAlive
                    ? "var(--color-accent-success)"
                    : "var(--color-accent-warning)"}
                title={`Backpack enabled on ${$appState.backpackApiEndpoint}`}
                onclick={() => {
                    backpackModeOpen = !backpackModeOpen
                }}
            />
        </div>
        <ContextMenu
            items={[
                {
                    name: "Search",
                    action: () => changeMode(BackpackMode.SEARCH),
                },
                {
                    name: "Geolocate",
                    action: () => changeMode(BackpackMode.GEOLOCATION),
                },
                { name: "-" },
                { name: "Off", action: () => changeMode(BackpackMode.OFF) },
            ]}
            open={backpackModeOpen}
            position={{
                x: -7,
                y: -120,
            }}
        />
    {:else}
        <FlashOffFilled color="#666" title="Backpack not available." />
    {/if}
</div>

<style lang="scss">
    .status-backpack {
        position: relative;
        display: grid;
        grid-template-columns: 1fr auto;
        text-transform: uppercase;
        font-size: 0.8rem;
        line-height: 1rem;
        color: var(--color-accent);
    }
</style>
