<script lang="ts">
    import { onDestroy, onMount } from "svelte"

    //TODO: convert this to a general component

    let dropdownel: HTMLElement
    let isOpen = false

    let entries = [
        { name: "Edit", action: () => console.log("edit") },
        { name: "Duplicate", action: () => console.log("duplicate") },
        { name: "Archive", action: () => console.log("archive") },
        { name: "Move", action: () => console.log("move") },
        { name: "Share", action: () => console.log("share") },
        {
            name: "Add to favorites",
            action: () => console.log("add to favorites"),
        },
        { name: "Delete", action: () => console.log("delete") },
    ]

    onMount(() => {
        dropdownel.addEventListener("click", (e) => {
            isOpen = !isOpen
        })

        document.addEventListener("click", (e) => {
            if (!dropdownel.contains(e.target as Node)) {
                isOpen = false
            }
        })
    })
</script>

<div class="relative inline-block text-left" bind:this={dropdownel}>
    <button
        type="button"
        class="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-black px-3 py-2 text-white-500 shadow-xs"
        id="menu-button"
        aria-expanded="true"
        aria-haspopup="true"
    >
        Options
        <svg
            id="dropdown-icon"
            class="-mr-1 size-5 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            data-slot="icon"
        >
            <path
                fill-rule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                clip-rule="evenodd"
            />
        </svg>
    </button>

    <div
        class="menu2 absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-800 rounded-md bg-surface-700 focus:outline-hidden"
        class:isOpen
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="menu-button"
        tabindex="-1"
    >
        <div class="py-1" role="none">
            <!-- svelte-ignore a11y_invalid_attribute -->
            <a
                href="#"
                role="menuitem"
                tabindex="-1"
                id="menu-item-0"
                onclick={() => console.log("edit")}>Edit</a
            >
            <!-- svelte-ignore a11y_invalid_attribute -->
            <a href="#" role="menuitem" tabindex="-1" id="menu-item-1"
                >Duplicate</a
            >
        </div>
        <div class="py-1" role="none">
            <!-- svelte-ignore a11y_invalid_attribute -->
            <a href="#" role="menuitem" tabindex="-1" id="menu-item-2"
                >Archive</a
            >
            <!-- svelte-ignore a11y_invalid_attribute -->
            <a href="#" role="menuitem" tabindex="-1" id="menu-item-3">Move</a>
        </div>
        <div class="py-1" role="none">
            <!-- svelte-ignore a11y_invalid_attribute -->
            <a href="#" role="menuitem" tabindex="-1" id="menu-item-4">Share</a>
            <!-- svelte-ignore a11y_invalid_attribute -->
            <a href="#" role="menuitem" tabindex="-1" id="menu-item-5"
                >Add to favorites</a
            >
        </div>
        <div class="py-1" role="none">
            <!-- svelte-ignore a11y_invalid_attribute -->
            <a href="#" role="menuitem" tabindex="-1" id="menu-item-6">Delete</a
            >
        </div>
    </div>
</div>

<style lang="scss">
    .menu2 {
        visibility: hidden;
        box-shadow: 0 0.5em 1em black;
        a {
            display: block;
            padding-left: 1rem;
            padding-right: 1rem;
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
            font-size: 0.875rem;
            line-height: 1.25rem;
            --tw-text-opacity: 1;
            color: rgb(var(--color-primary-300));

            &:hover {
                background-color: rgb(var(--color-primary-900));
            }
        }
    }
    .menu2.isOpen {
        visibility: visible !important;
    }
</style>
