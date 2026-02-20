/**
 * Character replacements for normalizing LLM output
 * Maps nonstandard characters to their standard equivalents
 */
const CHAR_REPLACEMENTS: Record<string, string> = {
    // Curly/smart quotation marks
    "\u201C": '"',  // Left double quotation mark
    "\u201D": '"',  // Right double quotation mark
    "\u2018": "'",  // Left single quotation mark
    "\u2019": "'",  // Right single quotation mark
    "‹": "<",  // Left single angle quotation mark
    "›": ">",  // Right single angle quotation mark
    "«": '<<',  // Left double angle quotation mark
    "»": '>>',  // Right double angle quotation mark
    // Dashes
    "\u2013": "-",  // En dash
    "\u2014": "-",  // Em dash
    "\u2212": "-",  // Minus sign
    // Ellipsis
    "\u2026": "...",  // Horizontal ellipsis
    "\u00A0": " ",  // Non-breaking space to regular space
    "‛": "'",  // Single high-reversed-9 quotation mark
    "„": '"',  // Double low-9 quotation mark
    "‵": "'",  // Reversed single prime quotation mark
    "‶": '"',  // Reversed double prime quotation mark
    "（": "(",  // Fullwidth left parenthesis
    "）": ")",  // Fullwidth right parenthesis
    "‸": "^",  // Caret
    "-": "-",  // Hyphen-minus (just in case)
}

/**
 * Normalize LLM output by replacing nonstandard characters with standard equivalents
 * Makes it easy to add future character replacements
 * @param text - The text to normalize
 * @returns The normalized text
 */
export function normalizeCharacters(text: string): string {
    let result = text
    for (const [nonstandard, standard] of Object.entries(CHAR_REPLACEMENTS)) {
        result = result.replaceAll(nonstandard, standard)
    }
    return result
}
