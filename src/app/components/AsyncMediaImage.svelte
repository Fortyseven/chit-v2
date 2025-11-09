<script lang="ts">
    import { onMount } from "svelte"
    import {
        type MediaAttachment,
        getMediaBlob,
    } from "../../lib/chatSession/chatAttachments"
    import { memoizeBlobUrl } from "../../lib/memoizeBlob"

    export let media: MediaAttachment
    export let cssClass: string = ""
    export let altText: string = "Media Attachment"
    export let onClick: ((blob: Blob) => void) | undefined = undefined
    export let maxWidth: number | undefined = undefined
    export let maxHeight: number | undefined = undefined

    let imageUrl: string | null = null
    let loading = true
    let error = false

    onMount(async () => {
        try {
            const blob = await getMediaBlob(media)

            if (blob instanceof Blob) {
                const url = memoizeBlobUrl(blob)
                if (url) {
                    imageUrl = url
                } else {
                    console.warn(
                        "AsyncMediaImage: memoizeBlobUrl returned null/undefined",
                    )
                    error = true
                }
            } else {
                console.warn(
                    "Media data is not a blob:",
                    media.id,
                    "got:",
                    typeof blob,
                )
                error = true
            }
        } catch (err) {
            console.error("Failed to load media:", media.id, err)
            error = true
        } finally {
            loading = false
        }
    })

    function handleClick() {
        if (onClick && imageUrl) {
            // Get the blob from the URL for the onClick handler
            getMediaBlob(media).then((blob: Blob | string) => {
                if (blob instanceof Blob) {
                    onClick(blob)
                }
            })
        }
    }
</script>

{#if loading}
    <div class="media-loading {cssClass}">
        <span>Loading...</span>
    </div>
{:else if error}
    <div class="media-error {cssClass}">
        <span>Failed to load media</span>
    </div>
{:else if imageUrl}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <img
        src={imageUrl}
        class={cssClass}
        alt={altText}
        style="
            {maxWidth ? `max-width: ${maxWidth}px;` : ''}
            {maxHeight ? `max-height: ${maxHeight}px;` : ''}
        "
        on:click={handleClick}
    />
{/if}

<style>
    .media-loading,
    .media-error {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--color-background-secondary);
        border: 1px solid var(--color-border);
        border-radius: 4px;
        padding: 8px;
        min-height: 60px;
        min-width: 60px;
    }

    .media-error {
        background-color: var(--color-error-background, #ffe6e6);
        color: var(--color-error-text, #cc0000);
    }

    .media-loading span,
    .media-error span {
        font-size: 12px;
        opacity: 0.7;
    }
</style>
