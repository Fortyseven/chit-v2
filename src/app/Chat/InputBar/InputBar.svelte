<div
    class="input-group input-group-divider grid-cols-[auto_1fr_auto] rounded-container-token absolute bottom-0 p-4"
>
    <button class="input-group-shim">+</button>
    <textarea
        class="bg-transparent border-0 ring-0"
        name="prompt"
        id="prompt"
        placeholder="Write a message..."
        rows="1"
    >
    </textarea>
    <button class="variant-filled-primary">Send</button>
</div>

<style lang="scss">
    .input-group {
        display: grid;
        gap: 1em;
    }
    </style>