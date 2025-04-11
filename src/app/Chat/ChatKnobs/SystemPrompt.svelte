<script>
    import { derived, writable } from "svelte/store"
    import { appState } from "../../../lib/appState/appState"
    import { chatSetSystemPrompt } from "../../../lib/chatSession/chatActions"
    import { currentChat } from "../../../lib/chatSession/chatSession"

    let sys_prompt_state = writable($currentChat.system_prompt)

    sys_prompt_state.subscribe((value) => {
        chatSetSystemPrompt($appState.activeChatId, value)
    })

    currentChat.subscribe((value) => {
        if ($currentChat) {
            sys_prompt_state.set($currentChat.system_prompt)
        }
    })

    const PREVIEW_CUTOFF_LENGTH = 50

    const shortPrompt = derived(sys_prompt_state, ($sys_prompt_state) => {
        if (!$sys_prompt_state) return "No SPrompt"

        return $sys_prompt_state.length > PREVIEW_CUTOFF_LENGTH
            ? $sys_prompt_state.slice(0, PREVIEW_CUTOFF_LENGTH) + "..."
            : $sys_prompt_state
    })
</script>

<button tabindex="0" class="btn-prompt" onclick={() => sprompt.showModal()}>
    {$shortPrompt || "No SPrompt"}
</button>

<!-- <dialog id="sprompt" class="modal">
    <div class="modal-box">
        <h2>System Prompt</h2>
        <textarea
            id="prompt"
            name="prompt"
            placeholder="Write a system prompt..."
            rows="10"
            bind:value={$sys_prompt_state}
        ></textarea>
    </div>
        <div class="modal-action">
            <form method="dialog">
                <button class="btn btn-primary">Close</button>
            </form>
        </div>
</dialog> -->

<style lang="scss">
    #sprompt {
        width: 100%;
        max-width: 800px;
        max-height: 80vh;
        overflow: hidden;

        h2 {
            font-weight: bold;
            font-size: 1.25rem;
            padding-bottom: 1em;
        }

        textarea {
            width: 100%;
        }
    }

    .modal {
        pointer-events: none;
        visibility: hidden;
        position: fixed;
        inset: calc(0.25rem /* 4px */ * 0) /* 0rem = 0px */;
        margin: calc(0.25rem /* 4px */ * 0) /* 0rem = 0px */;
        display: grid;
        height: 100%;
        max-height: none;
        width: 100%;
        max-width: none;
        align-items: center;
        justify-items: center;
        background-color: transparent;
        padding: calc(0.25rem /* 4px */ * 0) /* 0rem = 0px */;
        color: inherit;
        overflow-x: hidden;
        transition:
            transform 0.3s ease-out,
            visibility 0.3s allow-discrete,
            background-color 0.3s ease-out,
            opacity 0.1s ease-out;
        overflow-y: hidden;
        overscroll-behavior: contain;
        z-index: 999;
        &::backdrop {
            display: none;
        }
        &.modal-open,
        &[open],
        &:target {
            background-color: oklch(0% 0 0/ 0.4);
            transition:
                transform 0.3s ease-out,
                background-color 0.3s ease-out,
                opacity 0.1s ease-out;
            pointer-events: auto;
            visibility: visible;
            opacity: 100%;
            .modal-box {
                translate: 0 0;
                scale: 1;
                opacity: 1;
            }
        }
        @starting-style {
            &.modal-open,
            &[open],
            &:target {
                visibility: hidden;
                opacity: 0%;
            }
        }

        .modal-box {
            grid-column-start: 1;
            grid-row-start: 1;
            max-height: 100vh;
            width: calc(11 / 12 * 100%);
            max-width: 32rem /* 512px */;
            background-color: var(--color-base-100) /* var(--color-base-100) */;
            padding: calc(0.25rem /* 4px */ * 6) /* 1.5rem = 24px */;
            transition:
                translate 0.3s ease-out,
                scale 0.3s ease-out,
                opacity 0.2s ease-out 0.05s,
                box-shadow 0.3s ease-out;
            border-top-left-radius: var(
                --modal-tl,
                var(--radius-box) /* var(--radius-box) */
            );
            border-top-right-radius: var(
                --modal-tr,
                var(--radius-box) /* var(--radius-box) */
            );
            border-bottom-left-radius: var(
                --modal-bl,
                var(--radius-box) /* var(--radius-box) */
            );
            border-bottom-right-radius: var(
                --modal-br,
                var(--radius-box) /* var(--radius-box) */
            );
            scale: 95%;
            opacity: 0;
            box-shadow: oklch(0% 0 0/ 0.25) 0px 25px 50px -12px;
            overflow-y: auto;
            overscroll-behavior: contain;
        }

        .modal-action {
            margin-top: calc(0.25rem /* 4px */ * 6) /* 1.5rem = 24px */;
            display: flex;
            justify-content: flex-end;
            gap: calc(0.25rem /* 4px */ * 2) /* 0.5rem = 8px */;
        }

        .btn {
            :where(&) {
                width: unset;
            }
            display: inline-flex;
            flex-shrink: 0;
            cursor: pointer;
            flex-wrap: nowrap;
            align-items: center;
            justify-content: center;
            gap: calc(0.25rem /* 4px */ * 1.5) /* 0.375rem = 6px */;
            text-align: center;
            vertical-align: middle;
            outline-offset: 2px;
            webkit-user-select: none;
            user-select: none;
            padding-inline: var(--btn-p);
            color: var(--btn-fg);
            --tw-prose-links: var(--btn-fg);
            height: var(--size);
            font-size: var(--fontsize, 0.875rem /* 14px */);
            font-weight: 600;
            outline-color: var(
                --btn-color,
                var(--color-base-content) /* var(--color-base-content) */
            );
            transition-property: color, background-color, border-color,
                box-shadow;
            transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
            transition-duration: 0.2s;
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
            background-color: var(--btn-bg);
            background-size: auto, calc(var(--noise) * 100%);
            background-image: none, var(--btn-noise);
            border-width: var(--border);
            border-style: solid;
            border-color: var(--btn-border);
            text-shadow: 0 0.5px oklch(100% 0 0 / calc(var(--depth) * 0.15));
            box-shadow:
                0 0.5px 0 0.5px oklch(100% 0 0 / calc(var(--depth) * 6%)) inset,
                var(--btn-shadow);
            --size: calc(var(--size-field, 0.25rem /* 4px */) * 10);
            --btn-bg: var(
                --btn-color,
                var(--color-base-200) /* var(--color-base-200) */
            );
            --btn-fg: var(--color-base-content) /* var(--color-base-content) */;
            --btn-p: 1rem /* 16px */;
            --btn-border: color-mix(
                in oklab,
                var(--btn-bg),
                #000 calc(var(--depth) * 5%)
            );
            --btn-shadow: 0 3px 2px -2px color-mix(in oklab, var(--btn-bg)
                            calc(var(--depth) * 30%), #0000),
                0 4px 3px -2px color-mix(in oklab, var(--btn-bg)
                            calc(var(--depth) * 30%), #0000);
            --btn-noise: var(--fx-noise);
            .prose & {
                text-decoration-line: none;
            }
            @media (hover: hover) {
                &:hover {
                    --btn-bg: color-mix(
                        in oklab,
                        var(
                            --btn-color,
                            var(--color-base-200) /* var(--color-base-200) */
                        ),
                        #000 7%
                    );
                }
            }
            &:focus-visible {
                outline-width: 2px;
                outline-style: solid;
            }
            &:active:not(.btn-active) {
                translate: 0 0.5px;
                --btn-bg: color-mix(
                    in oklab,
                    var(
                        --btn-color,
                        var(--color-base-200) /* var(--color-base-200) */
                    ),
                    #000 5%
                );
                --btn-border: color-mix(
                    in oklab,
                    var(
                        --btn-color,
                        var(--color-base-200) /* var(--color-base-200) */
                    ),
                    #000 7%
                );
                --btn-shadow: 0 0 0 0 oklch(0% 0 0/0), 0 0 0 0 oklch(0% 0 0/0);
            }
            &:is(:disabled, [disabled], .btn-disabled) {
                &:not(.btn-link, .btn-ghost) {
                    background-color: color-mix(
                        in oklab,
                        var(--color-base-content)
                            /* var(--color-base-content) */ 10%,
                        transparent
                    );
                    box-shadow: none;
                }
                pointer-events: none;
                --btn-border: #0000;
                --btn-noise: none;
                --btn-fg: color-mix(
                    in oklch,
                    var(--color-base-content) /* var(--color-base-content) */
                        20%,
                    #0000
                );
                @media (hover: hover) {
                    &:hover {
                        pointer-events: none;
                        background-color: color-mix(
                            in oklab,
                            var(--color-neutral) /* var(--color-neutral) */ 20%,
                            transparent
                        );
                        --btn-border: #0000;
                        --btn-fg: color-mix(
                            in oklch,
                            var(--color-base-content)
                                /* var(--color-base-content) */ 20%,
                            #0000
                        );
                    }
                }
            }
            &:is(input[type="checkbox"], input[type="radio"]) {
                appearance: none;
                &::after {
                    content: attr(aria-label);
                }
            }
            &:where(input:checked:not(.filter .btn)) {
                --btn-color: var(--color-primary) /* var(--color-primary) */;
                --btn-fg: var(--color-primary-content)
                    /* var(--color-primary-content) */;
                isolation: isolate;
            }
        }

        .btn-primary {
            --btn-color: var(--color-primary) /* var(--color-primary) */;
            --btn-fg: var(--color-primary-content)
                /* var(--color-primary-content) */;
        }
    }
</style>
