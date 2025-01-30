<script>
    import { createEventDispatcher, onMount, setContext } from "svelte"
    import { writable } from "svelte/store"
    /**
     * @typedef {Object} Props
     * @property {import('svelte').Snippet} [children]
     */

    /** @type {Props} */
    // let { children } = $props();

    // let el = $state(undefined)
    let el = undefined

    // const eventBusStore = writable(undefined);
    // setContext('event-bus', eventBusStore);

    function repeatEvent(ev) {
        // console.log(
        //     'repeatEvent',
        //     ev.detail.name,
        //     ev.detail?.data || undefined
        // );
        // // dispatch(ev.detail.name, ev.detail?.data || undefined);
        // eventBusStore.set({
        //     name: ev.detail.name,
        //     data: ev.detail?.data || undefined
        // });
    }

    onMount(() => {
        // console.log('EventRepeater onMount', el);
        // window.addEventListener('message', repeatEvent);
    })
</script>

<div id="EventRepeater" bind:this={el} class="h-full w-full">
    <!-- {@render children?.()} -->
</div>
