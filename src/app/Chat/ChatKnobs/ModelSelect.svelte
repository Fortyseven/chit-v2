<script>
    import { get, writable } from "svelte/store"
    import { appState } from "../../../appState/appState"
    import { chatSetModel } from "../../../lib/chatSession/chatActions"
    import { currentChat } from "../../../lib/chatSession/chatSession"
    import llm from "../../../lib/llm/ollama"

    let selected_model = writable($currentChat.model_name)

    selected_model.subscribe((value) => {
        chatSetModel($appState.activeChatId, value)
    })

    currentChat.subscribe((value) => {
        if ($currentChat) {
            selected_model.set($currentChat.model_name)
        }
    })
</script>

<div class="model-select">
    {#key selected_model}
        <select
            bind:value={$selected_model}
            name="system"
            id="system"
            class="select"
        >
            {#each get($llm.models) as { model, name }}
                <option value={model}>{name}</option>
            {/each}
        </select>
    {/key}
</div>

<style lang="scss">
    .model-select {
        place-content: center;
        display: flex;
        flex-direction: row;
        gap: 2rem;
    }

    select {
        flex: auto;
        width: 100%;
        padding-inline-start: calc(0.25rem /* 4px */ * 4) /* 1rem = 16px */;
        padding-inline-end: calc(0.25rem /* 4px */ * 7) /* 1.75rem = 28px */;
        max-width: 20rem /* 320px */;
    }

    .select {
        border: var(--border) solid #0000;
        position: relative;
        display: inline-flex;
        flex-shrink: 1;
        appearance: none;
        align-items: center;
        gap: calc(0.25rem /* 4px */ * 1.5) /* 0.375rem = 6px */;
        background-color: var(--color-base-100) /* var(--color-base-100) */;
        padding-inline-start: calc(0.25rem /* 4px */ * 4) /* 1rem = 16px */;
        padding-inline-end: calc(0.25rem /* 4px */ * 7) /* 1.75rem = 28px */;
        vertical-align: middle;
        width: clamp(3rem /* 48px */, 20rem /* 320px */, 100%);
        height: var(--size);
        font-size: 0.875rem /* 14px */;
        border-start-start-radius: var(
            --join-ss,
            var(--radius-field) /* var(--radius-field) */
        );
        border-start-end-radius: var(
            --join-se,
            var(--radius-field) /* var(--radius-field) */
        );
        border-end-start-radius: var(
            --join-es,
            var(--radius-field) /* var(--radius-field) */
        );
        border-end-end-radius: var(
            --join-ee,
            var(--radius-field) /* var(--radius-field) */
        );
        background-image: linear-gradient(45deg, #0000 50%, currentColor 50%),
            linear-gradient(135deg, currentColor 50%, #0000 50%);
        background-position:
            calc(100% - 20px) calc(1px + 50%),
            calc(100% - 16.1px) calc(1px + 50%);
        background-size:
            4px 4px,
            4px 4px;
        background-repeat: no-repeat;
        text-overflow: ellipsis;
        box-shadow:
            0 1px
                color-mix(
                    in oklab,
                    var(--input-color) calc(var(--depth) * 10%),
                    #0000
                )
                inset,
            0 -1px oklch(100% 0 0 / calc(var(--depth) * 0.1)) inset;
        border-color: var(--input-color);
        --input-color: color-mix(
            in oklab,
            var(--color-base-content) /* var(--color-base-content) */ 20%,
            #0000
        );
        --size: calc(var(--size-field, 0.25rem /* 4px */) * 10);
        [dir="rtl"] & {
            background-position:
                calc(0% + 12px) calc(1px + 50%),
                calc(0% + 16px) calc(1px + 50%);
        }
        select {
            margin-inline-start: calc(0.25rem /* 4px */ * -4)
                /* -1rem = -16px */;
            margin-inline-end: calc(0.25rem /* 4px */ * -7)
                /* -1.75rem = -28px */;
            width: calc(100% + 2.75rem /* 44px */);
            appearance: none;
            padding-inline-start: calc(0.25rem /* 4px */ * 4) /* 1rem = 16px */;
            padding-inline-end: calc(0.25rem /* 4px */ * 7) /* 1.75rem = 28px */;
            height: calc(100% - 2px);
            background: inherit;
            border-radius: inherit;
            border-style: none;
            &:focus,
            &:focus-within {
                --tw-outline-style: none;
                outline-style: none;
                @media (forced-colors: active) {
                    outline: 2px solid transparent;
                    outline-offset: 2px;
                }
            }
            &:not(:last-child) {
                margin-inline-end: calc(0.25rem /* 4px */ * -5.5)
                    /* -1.375rem = -22px */;
                background-image: none;
            }
        }
        &:focus,
        &:focus-within {
            --input-color: var(--color-base-content)
                /* var(--color-base-content) */;
            box-shadow: 0 1px
                color-mix(
                    in oklab,
                    var(--input-color) calc(var(--depth) * 10%),
                    #0000
                );
            outline: 2px solid var(--input-color);
            outline-offset: 2px;
        }
        &:has(> select[disabled]),
        &:is(:disabled, [disabled]) {
            cursor: not-allowed;
            border-color: var(--color-base-200) /* var(--color-base-200) */;
            background-color: var(--color-base-200) /* var(--color-base-200) */;
            color: color-mix(
                in oklab,
                var(--color-base-content) /* var(--color-base-content) */ 40%,
                transparent
            );
            &::placeholder {
                color: color-mix(
                    in oklab,
                    var(--color-base-content) /* var(--color-base-content) */
                        20%,
                    transparent
                );
            }
        }
        &:has(> select[disabled]) > select[disabled] {
            cursor: not-allowed;
        }
    }
</style>
