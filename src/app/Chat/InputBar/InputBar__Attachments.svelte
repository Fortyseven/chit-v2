<script lang="ts">
    import {
        chatAddPastedMedia,
        chatClearPastedMedia,
        ChatMediaType,
    } from "../../../lib/chatSession/chatAttachments"
    import { currentChat } from "../../../lib/chatSession/chatSession"
    import { memoizeBlobUrl } from "../../../lib/memoizeBlob"
    import { loadFile } from "../../../lib/utils"

    import { EXIF } from "../../../vendor/exif"
    import Pill from "../../UI/Pill/Pill.svelte"

    export let inputBoxEl: HTMLTextAreaElement | undefined = undefined

    const EXIF_IGNORE_TAGS = [
        "ApertureValue",
        "CFAPattern",
        "ColorSpace",
        "Contrast",
        "CustomRendered",
        "ExifIFDPointer",
        "ExifVersion",
        "ExposureBias",
        "ExposureMode",
        "ExposureProgram",
        "ExposureTime",
        "FileSource",
        "Flash",
        "FNumber",
        "FocalLength",
        "FocalLengthIn35mmFilm",
        "FocalPlaneResolutionUnit",
        "FocalPlaneXResolution",
        "FocalPlaneYResolution",
        "GainControl",
        "ISOSpeedRatings",
        "MaxApertureValue",
        "MeteringMode",
        "Orientation",
        "PixelXDimension",
        "PixelYDimension",
        "ResolutionUnit",
        "Saturation",
        "SceneCaptureType",
        "SceneType",
        "SensingMethod",
        "Sharpness",
        "ShutterSpeedValue",
        "SubjectDistanceRange",
        "SubsecTime",
        "SubsecTimeDigitized",
        "SubsecTimeOriginal",
        "thumbnail",
        "undefined",
        "UserComment",
        "WhiteBalance",
        "XResolution",
        "YResolution",
        "SamplesPerPixel",
        "DigitalZoomRation",
        "BrightnessValue",
        "BitsPerSample",
        "ImageWidth",
        "ImageHeight",
        "PhotometricInterpretation",
    ]

    /**
     * Process the EXIF data from a blob, filtering out unwanted tags.
     * @param {Blob} blob - The image blob to process
     */

    function processExifBlob(blob: Blob) {
        const img = new Image()
        img.src = URL.createObjectURL(blob)
        img.onload = function () {
            EXIF.getData(img, () => {
                const allMetaData = EXIF.getAllTags(this)

                const filteredMetaData = Object.entries(allMetaData).reduce(
                    (acc, [key, value]) => {
                        if (!EXIF_IGNORE_TAGS.includes(key)) {
                            acc[key] = value
                        }
                        return acc
                    },
                    {} as Record<string, any>,
                )
                console.log("FILTERED EXIF DATA", filteredMetaData)

                if (inputBoxEl) {
                    inputBoxEl.value += JSON.stringify(
                        filteredMetaData,
                        null,
                        2,
                    )
                }
            })
            URL.revokeObjectURL(img.src)
        }

        img.onerror = function (error) {
            console.error("Error loading image:", error)
            URL.revokeObjectURL(img.src)
        }
    }

    /* ------------------------------------------------------ */
    async function onClickAddContext() {
        let loadedFile = await loadFile([
            ".jpg",
            ".png",
            ".webp",
            ".gif",
            ".txt",
            ".pdf",
            ".md",
            ".py",
            ".js",
            ".html",
            ".htm",
            ".css",
            ".json",
            ".csv",
            ".xml",
            ".yml",
            ".yaml",
            ".toml",
        ])

        if (loadedFile) {
            const type = loadedFile.file.type
            const file = loadedFile.file
            let result = loadedFile.result

            if (file && type) {
                if (type.startsWith("text/") && inputBoxEl) {
                    inputBoxEl.value += result
                } else if (type.startsWith("image/")) {
                    console.log("UPLOADED TYPE", type)
                    const blob = new Blob([result], { type })

                    processExifBlob(file)
                    // console.log("UPLOADED FILE", result)
                    chatAddPastedMedia(
                        $currentChat?.id,
                        blob,
                        ChatMediaType.IMAGE,
                    )
                } else {
                    throw `Unsupported file type:${type}`
                }
            } else {
                throw new Error("File or type is undefined")
            }
        }
    }
</script>

<button class="small" onclick={onClickAddContext}>Add Context +</button>

{#if $currentChat?.pastedMedia}
    {#each $currentChat?.pastedMedia as media, index}
        {#key index}
            {#if media.type == ChatMediaType.IMAGE}
                <Pill
                    text="Image"
                    dismissible
                    enableTooltip
                    color="var(--color-accent-complement)"
                    on:dismiss={() => {
                        chatClearPastedMedia($currentChat?.id, media.id)
                    }}
                >
                    <!-- svelte-ignore a11y_missing_attribute -->
                    {#if media.data instanceof Blob}
                        <img
                            src={memoizeBlobUrl(media.data)}
                            class="btn-image-attach"
                        />
                    {/if}
                </Pill>
            {:else if media.type === ChatMediaType.TEXT}
                <Pill
                    text="Text"
                    dismissible
                    color="var(--color-accent-complement)"
                    on:dismiss={() => {
                        chatClearPastedMedia($currentChat?.id, media.id)
                    }}
                >
                    {media}
                </Pill>
            {:else}
                ????
            {/if}
        {/key}
    {/each}
{/if}

<!-- {#if $currentChat?.pastedMedia && $currentChat?.pastedMedia instanceof File}
    <Pill
        text="File"
        dismissible={$currentChat?.pastedMedia instanceof File}
        color="var(--color-accent-complement)"
        on:dismiss={() => {
            chatClearPastedMedia()
        }}
    >
        {$currentChat?.pastedMedia.name}
    </Pill>
{/if}

{#if $currentChat?.pastedMedia && $currentChat?.pastedMedia instanceof Blob}
    <Pill
        text="Image"
        dismissible={$currentChat?.pastedMedia &&
            $currentChat?.pastedMedia instanceof Blob}
        color="var(--color-accent-complement)"
        on:dismiss={() => {
            chatClearPastedMedia()
        }}
    >

        <img
            src={$currentChat?.pastedMedia
                ? URL.createObjectURL($currentChat?.pastedMedia)
                : ""}
            class="btn-image-attach"
        />
    </Pill>
{/if} -->

<style lang="scss">
    .btn-image-attach {
        position: relative;
        right: 0px;
        top: 0;
        max-width: 256px;
        max-height: 256px;
    }
</style>
