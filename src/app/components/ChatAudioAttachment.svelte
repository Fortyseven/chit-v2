<script lang="ts">
    import {
        type MediaAttachment,
        getMediaBlob,
    } from "$lib/chatSession/chatAttachments"
    import { memoizeBlobUrl } from "$lib/memoizeBlob"
    import { Audiotrack } from "svelte-google-materialdesign-icons"
    import { onMount } from "svelte"

    export let media: MediaAttachment

    let audioUrl: string | null = null
    let duration: string = ""
    let loading = true
    let error = false

    function formatDuration(seconds: number): string {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    onMount(async () => {
        try {
            const blob = await getMediaBlob(media)
            if (blob instanceof Blob) {
                audioUrl = memoizeBlobUrl(blob)
            } else {
                error = true
            }
        } catch (err) {
            console.error("Failed to load audio for display:", err)
            error = true
        } finally {
            loading = false
        }
    })

    function onLoadedMetadata(audioEl: HTMLAudioElement) {
        duration = formatDuration(audioEl.duration)
    }
</script>

<div class="audio-attachment">
    {#if loading}
        <div class="audio-loading">
            <span>Loading audio...</span>
        </div>
    {:else if error || !audioUrl}
        <div class="audio-error">
            <Audiotrack size="24" />
            <span>{media.filename || "Audio file"}</span>
            <span class="error-label">Failed to load</span>
        </div>
    {:else}
        <div class="audio-player-wrapper">
            <div class="audio-info">
                <Audiotrack size="24" />
                <div class="audio-meta">
                    <span class="audio-filename">{media.filename || "Audio file"}</span>
                    {#if duration}
                        <span class="audio-duration">{duration}</span>
                    {/if}
                </div>
            </div>
            <audio
                src={audioUrl}
                controls
                on:loadedmetadata={(e) => onLoadedMetadata(e.currentTarget)}
            ></audio>
        </div>
    {/if}
</div>

<style lang="scss">
    .audio-attachment {
        width: 100%;
        max-width: 480px;
        margin-block-start: 1em;
        margin-block-end: 0.5em;

        .audio-loading,
        .audio-error {
            display: flex;
            align-items: center;
            gap: 0.5em;
            padding: 1em;
            background-color: var(--color-background-darker);
            border-radius: var(--border-radius-standard);
            color: var(--color-neutral);
            font-size: 0.9em;
            opacity: 0.7;
        }

        .audio-error {
            .error-label {
                color: var(--color-error, #cc0000);
                font-size: 0.8em;
            }
        }

        .audio-player-wrapper {
            background-color: var(--color-background-darker);
            border: 1px solid var(--color-background-lighter);
            border-radius: var(--border-radius-standard);
            padding: 1em;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);

            .audio-info {
                display: flex;
                align-items: center;
                gap: 0.75em;
                margin-block-end: 0.75em;
                color: var(--color-accent-complement);

                .audio-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 0.15em;

                    .audio-filename {
                        font-size: 0.9em;
                        font-weight: 500;
                        color: var(--color-neutral);
                    }

                    .audio-duration {
                        font-size: 0.75em;
                        font-family: monospace;
                        color: var(--color-background-lighter);
                    }
                }
            }

            audio {
                width: 100%;
                height: 32px;
                outline: none;
            }
        }
    }
</style>
