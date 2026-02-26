import vocabData from "../../data/vocab.json";
import flashcardsData from "../../data/flashcards.json";
import conjugationsData from "../../data/conjugations.json";
import grammarData from "../../data/grammar.json";
import sentencesData from "../../data/sentences.json";

export type VocabItem = {
  id: string;
  italian: string;
  english: string;
  gender: string | null;
  partOfSpeech: string;
  example: string;
  tags: string[];
  unit?: number;
  pronunciation?: string;
};

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  tags: string[];
};

export type Conjugation = {
  id: string;
  verb: string;
  meaning: string;
  tense: string;
  forms: Record<string, string>;
};

export type GrammarRule = {
  id: string;
  rule: string;
  explanation: string;
  examples: string[];
  tags: string[];
};

export type SentenceExercise = {
  id: string;
  italian: string;
  english: string;
  parts: string[];
  distractors: string[];
  tags: string[];
};

export const vocab: VocabItem[] = vocabData as VocabItem[];
export const flashcards: Flashcard[] = flashcardsData as Flashcard[];
export const conjugations: Conjugation[] = conjugationsData as Conjugation[];
export const grammar: GrammarRule[] = grammarData as GrammarRule[];
export const sentences: SentenceExercise[] = sentencesData as SentenceExercise[];

// Unit numbers available across content
export const UNITS = [1, 2, 3, 4, 5] as const;
export type UnitNumber = (typeof UNITS)[number];

/** Extract unit number from lesson tags (e.g. "lesson-2" → 2). Defaults to 1. */
function getUnitFromTags(tags: string[]): number {
  const lessonTag = tags.find((t) => t.startsWith("lesson-"));
  if (lessonTag) return parseInt(lessonTag.replace("lesson-", ""), 10);
  return 1;
}

/** Returns the unit for a vocab item (explicit unit field takes priority, fallback to tags) */
export function getVocabUnit(item: VocabItem): number {
  return item.unit ?? getUnitFromTags(item.tags);
}

/** Returns the unit for a flashcard (derived from lesson tags) */
export function getFlashcardUnit(item: Flashcard): number {
  return getUnitFromTags(item.tags);
}

/** Returns the unit for a grammar rule (derived from lesson tags) */
export function getGrammarUnit(item: GrammarRule): number {
  return getUnitFromTags(item.tags);
}

/** Returns the unit for a sentence exercise (derived from lesson tags) */
export function getSentenceUnit(item: SentenceExercise): number {
  return getUnitFromTags(item.tags);
}

export function getVocabTags(): string[] {
  return [...new Set(vocab.flatMap((v) => v.tags))].sort();
}

export function getGrammarTags(): string[] {
  return [...new Set(grammar.flatMap((g) => g.tags))].sort();
}

export function getFlashcardTags(): string[] {
  return [...new Set(flashcards.flatMap((f) => f.tags))].sort();
}

export function filterVocab(query: string, tag: string, unit?: number): VocabItem[] {
  return vocab.filter((v) => {
    const matchesUnit = !unit || getVocabUnit(v) === unit;
    const matchesTag = !tag || v.tags.includes(tag);
    const matchesQuery =
      !query ||
      v.italian.toLowerCase().includes(query.toLowerCase()) ||
      v.english.toLowerCase().includes(query.toLowerCase());
    return matchesUnit && matchesTag && matchesQuery;
  });
}

export function filterGrammar(query: string, tag: string, unit?: number): GrammarRule[] {
  return grammar.filter((g) => {
    const matchesUnit = !unit || getGrammarUnit(g) === unit;
    const matchesTag = !tag || g.tags.includes(tag);
    const matchesQuery =
      !query ||
      g.rule.toLowerCase().includes(query.toLowerCase()) ||
      g.explanation.toLowerCase().includes(query.toLowerCase());
    return matchesUnit && matchesTag && matchesQuery;
  });
}

export function filterFlashcards(unit?: number): Flashcard[] {
  if (!unit) return flashcards;
  return flashcards.filter((f) => getFlashcardUnit(f) === unit);
}

export function filterSentences(unit?: number): SentenceExercise[] {
  if (!unit) return sentences;
  return sentences.filter((s) => getSentenceUnit(s) === unit);
}

export function filterVocabForQuiz(unit?: number): VocabItem[] {
  if (!unit) return vocab;
  return vocab.filter((v) => getVocabUnit(v) === unit);
}

export function getVocabById(id: string): VocabItem | undefined {
  return vocab.find((v) => v.id === id);
}

export function getConjugationVerbs(): string[] {
  return [...new Set(conjugations.map((c) => c.verb))].sort();
}

export function getConjugationTenses(): string[] {
  return [...new Set(conjugations.map((c) => c.tense))];
}

export function getConjugation(verb: string, tense: string): Conjugation | undefined {
  return conjugations.find((c) => c.verb === verb && c.tense === tense);
}

export function getVocabDistractors(
  correct: VocabItem,
  count = 3,
  unitFilter?: number
): VocabItem[] {
  const pool = unitFilter ? vocab.filter((v) => getVocabUnit(v) === unitFilter) : vocab;
  // Prefer same-tag distractors
  const sameTags = pool.filter(
    (v) => v.id !== correct.id && v.tags.some((t) => correct.tags.includes(t))
  );
  const others = pool.filter(
    (v) => v.id !== correct.id && !sameTags.find((s) => s.id === v.id)
  );
  const combined = [...sameTags, ...others];
  const shuffled = combined.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
