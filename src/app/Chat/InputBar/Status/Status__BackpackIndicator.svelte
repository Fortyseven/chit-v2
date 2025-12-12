<script lang="ts">
    import { appState } from "$lib/appState/appState"
    import { chatSetBackpackMode } from "$lib/chatSession/chatActions"
    import { BackpackMode, currentChat } from "$lib/chatSession/chatSession"
    import { FlashFilled, FlashOffFilled } from "carbon-icons-svelte"
    import ContextMenu from "../../../UI/ContextMenu.svelte"

    const LIVE_INTERVAL = 1000 * 60 * 2
    const RETRY_INTERVAL = 5000

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
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span
            class="hitbox"
            onclick={() => {
                backpackModeOpen = !backpackModeOpen
            }}
        >
            <div>{backpackModeId}</div>
            <div>
                <FlashFilled
                    color={backpackAlive
                        ? "var(--color-success)"
                        : "var(--color-warning)"}
                    title={`Backpack enabled on ${$appState.backpackApiEndpoint}`}
                />
            </div>
        </span>
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

        .hitbox {
            display: contents;
            cursor: pointer;
        }
    }
</style>
