/**
 * Strip HTML tags and common markdown formatting from text for clean TTS output
 */
export function stripFormatting(text: string): string {
    if (!text) return ""
    return text
        // Strip HTML tags
        .replace(/<[^>]+>/g, "")
        // Strip bold/italic: ***text***, **text**, *text*, ___text___, __text__, _text_
        .replace(/\*{1,3}([^*\n]+)\*{1,3}/g, "$1")
        .replace(/_{1,3}([^_\n]+)_{1,3}/g, "$1")
        // Strip inline code
        .replace(/`([^`]+)`/g, "$1")
        // Strip markdown links [label](url) → label
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        // Normalize whitespace
        .replace(/\s+/g, " ")
        .trim()
}
