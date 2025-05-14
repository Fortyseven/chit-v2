<script>
    import { FlashFilled, FlashOffFilled } from "carbon-icons-svelte"
    import { appState } from "../../../../lib/appState/appState"

    const LIVE_INTERVAL = 10000
    const RETRY_INTERVAL = 2000

    let backpackAlive = false
    let backpackAdaptiveInterval = RETRY_INTERVAL

    let heartbeat_timer = setTimeout(() => {
        checkBackpack()
    }, backpackAdaptiveInterval)

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
                heartbeat_timer = setTimeout(() => {
                    checkBackpack()
                }, backpackAdaptiveInterval)
            }
        }
    }
    checkBackpack()
</script>

{#if $appState.backpackApiEndpoint}
    <FlashFilled
        color={backpackAlive
            ? "var(--color-accent-success)"
            : "var(--color-accent-warning)"}
        title={`Backpack enabled on ${$appState.backpackApiEndpoint}`}
    />
{:else}
    <FlashOffFilled size="1em" color="#666" title="Backpack not available." />
{/if}

<style lang="scss">
</style>
