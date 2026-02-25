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

export const vocab: VocabItem[] = vocabData;
export const flashcards: Flashcard[] = flashcardsData;
export const conjugations: Conjugation[] = conjugationsData;
export const grammar: GrammarRule[] = grammarData;
export const sentences: SentenceExercise[] = sentencesData;

export function getVocabTags(): string[] {
  return [...new Set(vocab.flatMap((v) => v.tags))].sort();
}

export function getGrammarTags(): string[] {
  return [...new Set(grammar.flatMap((g) => g.tags))].sort();
}

export function getFlashcardTags(): string[] {
  return [...new Set(flashcards.flatMap((f) => f.tags))].sort();
}

export function filterVocab(query: string, tag: string): VocabItem[] {
  return vocab.filter((v) => {
    const matchesTag = !tag || v.tags.includes(tag);
    const matchesQuery =
      !query ||
      v.italian.toLowerCase().includes(query.toLowerCase()) ||
      v.english.toLowerCase().includes(query.toLowerCase());
    return matchesTag && matchesQuery;
  });
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
  count = 3
): VocabItem[] {
  // Prefer same-tag distractors
  const sameTags = vocab.filter(
    (v) => v.id !== correct.id && v.tags.some((t) => correct.tags.includes(t))
  );
  const others = vocab.filter(
    (v) => v.id !== correct.id && !sameTags.find((s) => s.id === v.id)
  );
  const pool = [...sameTags, ...others];
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
