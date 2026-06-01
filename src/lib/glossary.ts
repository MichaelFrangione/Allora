import glossaryData from "../../data/glossary.json";

// Italian word (lowercase) → short English translation, for inline drill glossing.
export const glossary: Record<string, string> = glossaryData as Record<string, string>;

/** Returns the English gloss for an Italian word, or undefined if not glossable. */
export function glossFor(word: string): string | undefined {
  return glossary[word.toLowerCase()];
}
