// Vocab is split into themed files under data/vocab/ for maintainability.
import vocabVerbs from "../../data/vocab/verbs.json";
import vocabFoodDrink from "../../data/vocab/food-drink.json";
import vocabPeopleFamily from "../../data/vocab/people-family.json";
import vocabHomeDaily from "../../data/vocab/home-daily.json";
import vocabWorkMoney from "../../data/vocab/work-money.json";
import vocabTravelCity from "../../data/vocab/travel-city.json";
import vocabTimeDates from "../../data/vocab/time-dates.json";
import vocabCommunication from "../../data/vocab/communication.json";
import vocabDescriptions from "../../data/vocab/descriptions.json";
import vocabCulture from "../../data/vocab/culture.json";
import vocabAbstract from "../../data/vocab/abstract.json";
import flashcardsData from "../../data/flashcards.json";
// Conjugations are split by verb group under data/conjugations/.
import conjRegularAre from "../../data/conjugations/regular-are.json";
import conjRegularEre from "../../data/conjugations/regular-ere.json";
import conjRegularIre from "../../data/conjugations/regular-ire.json";
import conjIrregular from "../../data/conjugations/irregular.json";
import conjReflexive from "../../data/conjugations/reflexive.json";
import grammarData from "../../data/grammar.json";
import sentencesData from "../../data/sentences.json";
import pronunciationData from "../../data/pronunciation.json";
import concordanzaData from "../../data/concordanza.json";
import modalVerbsData from "../../data/modal-verbs.json";
import piacereData from "../../data/piacere-drill.json";
import preposizioniData from "../../data/preposizioni-drill.json";
import ristoranteData from "../../data/ristorante-drill.json";
import alBarData from "../../data/al-bar-drill.json";
import possessiviData from "../../data/possessivi-drill.json";
import riflessiviData from "../../data/riflessivi-drill.json";
import pronomiData from "../../data/pronomi-drill.json";
import essereAvereData from "../../data/essere-avere-drill.json";
import articoliData from "../../data/articoli-drill.json";
import genereData from "../../data/genere-drill.json";
import pluraliData from "../../data/plurali-drill.json";
import aggettiviData from "../../data/aggettivi-drill.json";
import interrogativiData from "../../data/interrogativi-drill.json";
import dimostrativiData from "../../data/dimostrativi-drill.json";
import salutiData from "../../data/saluti-drill.json";

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

export type PronunciationExample = {
  italian: string;
  phonetic: string;
  english: string;
};

export type PronunciationRule = {
  id: string;
  combo: string;
  rule: string;
  phonetic: string;
  examples: PronunciationExample[];
  tags: string[];
};

export const vocab: VocabItem[] = [
  ...vocabVerbs,
  ...vocabFoodDrink,
  ...vocabPeopleFamily,
  ...vocabHomeDaily,
  ...vocabWorkMoney,
  ...vocabTravelCity,
  ...vocabTimeDates,
  ...vocabCommunication,
  ...vocabDescriptions,
  ...vocabCulture,
  ...vocabAbstract,
] as VocabItem[];
export const flashcards: Flashcard[] = flashcardsData as Flashcard[];
export const conjugations: Conjugation[] = [
  ...conjRegularAre,
  ...conjRegularEre,
  ...conjRegularIre,
  ...conjIrregular,
  ...conjReflexive,
] as Conjugation[];
export const grammar: GrammarRule[] = grammarData as GrammarRule[];
export const sentences: SentenceExercise[] = sentencesData as SentenceExercise[];
export const pronunciationRules: PronunciationRule[] = pronunciationData as PronunciationRule[];

export type ConcordanzaQuestion = {
  id: string;
  sentence: string;
  hint: string;
  adjective: string;
  correct: string;
  options: string[];
  tags: string[];
};

export const concordanza: ConcordanzaQuestion[] = concordanzaData as ConcordanzaQuestion[];

export interface ModalVerbQuestion {
  id: string;
  category: "slide-9" | "slide-10";
  prompt?: string;
  sentence: string;
  hint: string;
  correct: string;
  options: string[];
  explanation?: string;
  tags: string[];
}

export const modalVerbs: ModalVerbQuestion[] = modalVerbsData as ModalVerbQuestion[];

export interface DrillQuestion {
  id: string;
  category?: string;
  prompt?: string;
  sentence: string;
  hint?: string;
  correct: string;
  options: string[];
  explanation?: string;
  tags: string[];
  /** When set (e.g. in the mistakes queue), attempts record under this contentType. */
  sourceType?: string;
}

export const piacereDrill: DrillQuestion[] = piacereData as DrillQuestion[];
export const preposizioniDrill: DrillQuestion[] = preposizioniData as DrillQuestion[];
export const ristoranteDrill: DrillQuestion[] = ristoranteData as DrillQuestion[];
export const alBarDrill: DrillQuestion[] = alBarData as DrillQuestion[];
export const possessiviDrill: DrillQuestion[] = possessiviData as DrillQuestion[];
export const riflessiviDrill: DrillQuestion[] = riflessiviData as DrillQuestion[];
export const pronomiDrill: DrillQuestion[] = pronomiData as DrillQuestion[];
export const essereAvereDrill: DrillQuestion[] = essereAvereData as DrillQuestion[];
export const articoliDrill: DrillQuestion[] = articoliData as DrillQuestion[];
export const genereDrill: DrillQuestion[] = genereData as DrillQuestion[];
export const pluraliDrill: DrillQuestion[] = pluraliData as DrillQuestion[];
export const aggettiviDrill: DrillQuestion[] = aggettiviData as DrillQuestion[];
export const interrogativiDrill: DrillQuestion[] = interrogativiData as DrillQuestion[];
export const dimostrativiDrill: DrillQuestion[] = dimostrativiData as DrillQuestion[];
export const salutiDrill: DrillQuestion[] = salutiData as DrillQuestion[];

/** All DrillQuiz-based drills keyed by their study contentType (for the mistakes queue). */
export const DRILL_BY_TYPE: Record<string, DrillQuestion[]> = {
  piacere: piacereDrill,
  preposizioni: preposizioniDrill,
  ristorante: ristoranteDrill,
  "al-bar": alBarDrill,
  possessivi: possessiviDrill,
  riflessivi: riflessiviDrill,
  pronomi: pronomiDrill,
  "essere-avere": essereAvereDrill,
  articoli: articoliDrill,
  genere: genereDrill,
  plurali: pluraliDrill,
  aggettivi: aggettiviDrill,
  interrogativi: interrogativiDrill,
  dimostrativi: dimostrativiDrill,
  saluti: salutiDrill,
};

/**
 * Subjects are the primary way content is organised (replacing units).
 * Each subject owns a set of tags; an item belongs to the subject if it carries
 * any of those tags. `id` is the canonical tag used when authoring new content.
 */
export type Subject = { id: string; label: string; emoji: string; tags: string[] };

export const SUBJECTS: Subject[] = [
  { id: "present-tense", label: "Present Tense", emoji: "🔤", tags: ["present-tense", "present", "conjugation", "are-verbs", "ere-verbs", "ire-verbs", "isc-verbs", "verbi-are", "verbi-ere", "verbi-ire", "verbi-misti"] },
  { id: "reflexive-verbs", label: "Reflexive Verbs", emoji: "🔁", tags: ["reflexive-verbs", "reflexive", "riflessivi"] },
  { id: "essere-avere", label: "Essere & Avere", emoji: "🟰", tags: ["essere-avere", "verb-essere", "verb-avere"] },
  { id: "modals", label: "Modal Verbs", emoji: "🔧", tags: ["modals", "dovere", "potere", "volere"] },
  { id: "articles", label: "Articles", emoji: "📰", tags: ["articles"] },
  { id: "gender", label: "Noun Gender", emoji: "⚥", tags: ["gender"] },
  { id: "plural", label: "Plurals", emoji: "➕", tags: ["plural"] },
  { id: "adjectives", label: "Adjectives", emoji: "🎨", tags: ["adjectives", "agreement", "concordanza", "e-adjectives", "descriptions"] },
  { id: "possessives", label: "Possessives", emoji: "👪", tags: ["possessives", "possessivi"] },
  { id: "pronouns", label: "Pronouns", emoji: "👉", tags: ["pronouns"] },
  { id: "interrogatives", label: "Question Words", emoji: "❓", tags: ["interrogatives", "question-words"] },
  { id: "demonstratives", label: "This & That", emoji: "👆", tags: ["demonstratives"] },
  { id: "greetings", label: "Greetings & Farewells", emoji: "👋", tags: ["greetings"] },
  { id: "piacere", label: "Piacere", emoji: "💚", tags: ["piacere", "mi-piace"] },
  { id: "prepositions", label: "Prepositions", emoji: "🔗", tags: ["prepositions", "articolate"] },
  { id: "food", label: "Food & Drink", emoji: "🍝", tags: ["food", "drinks", "pasta"] },
  { id: "bar", label: "Bar & Café", emoji: "☕", tags: ["bar"] },
  { id: "restaurant", label: "Restaurant", emoji: "🍽️", tags: ["restaurant"] },
  { id: "family", label: "Family & People", emoji: "👨‍👩‍👧", tags: ["family", "people", "identity"] },
  { id: "daily-life", label: "Daily Life", emoji: "🌅", tags: ["daily-life", "home", "habits"] },
  { id: "time", label: "Time & Dates", emoji: "🕐", tags: ["time", "days", "months", "seasons"] },
  { id: "travel", label: "Travel", emoji: "✈️", tags: ["travel", "transport"] },
  { id: "city", label: "City & Directions", emoji: "🏙️", tags: ["city", "directions", "places"] },
  { id: "work", label: "Work", emoji: "💼", tags: ["work"] },
  { id: "colors", label: "Colors", emoji: "🌈", tags: ["colors"] },
];

const SUBJECT_BY_ID = new Map(SUBJECTS.map((s) => [s.id, s]));

/** True when an item carrying `tags` belongs to the subject `subjectId`. */
export function tagsMatchSubject(tags: string[], subjectId: string): boolean {
  const subject = SUBJECT_BY_ID.get(subjectId);
  if (!subject) return false;
  return subject.tags.some((t) => tags.includes(t));
}

/** The subset of SUBJECTS that actually appear in the given content's tag lists. */
export function subjectsPresent(tagLists: string[][]): Subject[] {
  const allTags = new Set(tagLists.flat());
  return SUBJECTS.filter((s) => s.tags.some((t) => allTags.has(t)));
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
  const pool = vocab;
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
