import { Auto_awesome } from "svelte-google-materialdesign-icons";

export default {
    name: "LLM Prompt Enhancer",
    temperature: 0.7,
    icon: Auto_awesome,
    prompt: "You will be provided an LLM system prompt. Enhance the prompt, making it more robust, useful, and less prone to error/hallucination. Return the new prompt in a Markdown code block. Only return the code block, nothing else.",
}
