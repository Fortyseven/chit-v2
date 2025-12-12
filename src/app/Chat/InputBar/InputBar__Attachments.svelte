<script lang="ts">
    import {
        chatAddPastedMedia,
        chatClearPastedMedia,
        ChatMediaType,
    } from "$lib/chatSession/chatAttachments"
    import { currentChat } from "$lib/chatSession/chatSession"
    import { memoizeBlobUrl } from "$lib/memoizeBlob"
    import { loadFile } from "$lib/utils"
    import AsyncMediaImage from "../../components/AsyncMediaImage.svelte"

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

                console.debug("EXIF DATA", allMetaData)

                const filteredMetaData = Object.entries(allMetaData).reduce(
                    (acc, [key, value]) => {
                        if (!EXIF_IGNORE_TAGS.includes(key)) {
                            acc[key] = value
                        } else {
                            console.debug(
                                `Ignoring EXIF tag: ${key} with value: ${value}`,
                            )
                        }
                        return acc
                    },
                    {} as Record<string, any>,
                )
                console.log("FILTERED EXIF DATA", filteredMetaData)

                if (Object.entries(filteredMetaData).length && inputBoxEl) {
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
                console.debug("File type: ", type)
                if (type.startsWith("text/") && inputBoxEl) {
                    chatAddPastedMedia(
                        $currentChat?.id,
                        result,
                        ChatMediaType.TEXT,
                        file.name,
                    )
                } else if (type.startsWith("image/")) {
                    const blob = new Blob([result], { type })

                    processExifBlob(file)

                    chatAddPastedMedia(
                        $currentChat?.id,
                        blob,
                        ChatMediaType.IMAGE,
                        file.name,
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

<div class="input-attachments">
    <button class="btn-add-context" onclick={onClickAddContext}>
        Add Context +
    </button>

    {#if $currentChat?.pastedMedia}
        {#each $currentChat?.pastedMedia as media, index}
            {#key index}
                {#if media.type == ChatMediaType.IMAGE}
                    <Pill
                        text="Image"
                        dismissible
                        enableTooltip
                        startOpenTooltip
                        color="var(--color-accent-complement-darker)"
                        textColor="white"
                        on:dismiss={async () => {
                            await chatClearPastedMedia(
                                $currentChat?.id,
                                media.id,
                            )
                        }}
                    >
                        <!-- svelte-ignore a11y_missing_attribute -->
                        {#if media.data instanceof Blob}
                            <!-- Legacy in-memory blob -->
                            <img
                                src={memoizeBlobUrl(media.data)}
                                class="btn-image-attach"
                            />
                        {:else if media.isStored && media.blobId}
                            <!-- IndexedDB stored blob -->
                            <AsyncMediaImage
                                {media}
                                cssClass="btn-image-attach"
                                altText="Attached Image"
                                maxWidth={256}
                                maxHeight={256}
                            />
                        {:else}
                            <!-- Fallback for invalid media -->
                            <span class="media-error">Invalid media</span>
                        {/if}
                    </Pill>
                {:else if media.type === ChatMediaType.TEXT}
                    <Pill
                        text={media.filename ||
                            (typeof media.data === "string"
                                ? media.data.substring(0, 14) + "..."
                                : "Media file")}
                        dismissible
                        enableTooltip
                        startOpenTooltip
                        color="var(--color-accent-complement-darker)"
                        textColor="white"
                        on:dismiss={async () => {
                            await chatClearPastedMedia(
                                $currentChat?.id,
                                media.id,
                            )
                        }}
                    >
                        <div class="btn-text-attach">{media.data}</div>
                    </Pill>
                {:else}
                    ????
                {/if}
            {/key}
        {/each}
    {/if}
</div>

<style lang="scss">
    .input-attachments {
        display: flex;
        gap: 4px;
        flex-direction: column;
        flex-wrap: wrap;
        height: 100%;
        :global(.pill):hover {
            background: var(--color-background-lighter) !important;
        }

        .btn-add-context {
            background-color: var(--color-accent-tertiary);
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            font-size: 0.7rem;
            padding: 2px 8px;
            white-space: nowrap;
            cursor: default;
            user-select: none;
            font-weight: 500;
            transition: opacity 0.2s ease;
            cursor: pointer;
            width: 100%;
            transition: background-color 0.15s ease;
            &:hover {
                background-color: var(--color-accent-tertiary-lighter);
            }
        }

        .btn-text-attach,
        .btn-image-attach {
            position: relative;
            right: 0px;
            top: 0;
            max-width: 256px;
            max-height: 256px;
        }

        .btn-text-attach {
            text-wrap: wrap;
            text-overflow: ellipsis;
            height: fit-content;
            overflow: hidden;
            font-family: monospace;
            font-size: 0.9em;
            filter: blur(0.25);
        }

        .media-error {
            color: var(--color-error, #cc0000);
            font-size: 0.8em;
            padding: 4px;
        }
    }
</style>
