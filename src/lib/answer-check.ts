/** Pure helpers for typed-answer checking (kept React-free for tests). */

/** Case-, spacing-, apostrophe- and trailing-punctuation-tolerant normalization. */
export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/, "")
    .trim();
}

export function isAnswerCorrect(input: string, correct: string): boolean {
  return normalizeAnswer(input) === normalizeAnswer(correct);
}

/**
 * Whether an answer is reasonable to type: short phrases yes, whole translated
 * sentences no (those stay multiple-choice even in typing mode).
 */
export function isTypeable(correct: string): boolean {
  return correct.length <= 24 && correct.trim().split(/\s+/).length <= 3;
}

/** Accent keys offered above the typing input. */
export const ACCENT_KEYS = ["à", "è", "é", "ì", "ò", "ù"] as const;
