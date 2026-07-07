import { grammar, tagsMatchSubject } from "@/lib/content";
import { DRILLS } from "@/lib/drills";

// The Guide is organised by subject. Each topic opens its own page (/grammar/<id>)
// showing its reference content + quick links to its drills. `id` matches a subject id.
export type ExtraSection = "numbers-time" | "concordanza" | "preposizioni" | "passato-prossimo";

export type Topic = {
  id: string;
  emoji: string;
  label: string;
  /** Curated conjugation tables (by id) shown on the topic page. */
  conjIds?: string[];
  /** A bespoke visual reference block. */
  extra?: ExtraSection;
};

export const TOPICS: Topic[] = [
  { id: "present-tense", emoji: "🔤", label: "Present Tense — Regular & Irregular Verbs", conjIds: ["c001", "c002", "c003", "c004", "c005", "c006", "c007", "c008", "c009", "c010", "c011", "c012", "c013", "c098", "c099", "c103", "c104"] },
  { id: "reflexive-verbs", emoji: "🔁", label: "Reflexive Verbs", conjIds: ["c105", "c106", "c107", "c108", "c109", "c110", "c111"] },
  { id: "passato-prossimo", emoji: "⏮️", label: "Passato Prossimo — Avere & Essere", extra: "passato-prossimo" },
  { id: "modals", emoji: "🔧", label: "Modal Verbs", conjIds: ["c100", "c101", "c102"] },
  { id: "piacere", emoji: "💚", label: "Piacere" },
  { id: "pronouns", emoji: "👉", label: "Pronouns" },
  { id: "interrogatives", emoji: "❓", label: "Question Words" },
  { id: "demonstratives", emoji: "👆", label: "This & That" },
  { id: "greetings", emoji: "👋", label: "Greetings & Farewells" },
  { id: "articles", emoji: "📰", label: "Articles" },
  { id: "gender", emoji: "⚥", label: "Noun Gender" },
  { id: "plural", emoji: "➕", label: "Plurals" },
  { id: "adjectives", emoji: "🎨", label: "Adjectives & Agreement", extra: "concordanza" },
  { id: "possessives", emoji: "👪", label: "Possessives" },
  { id: "prepositions", emoji: "🔗", label: "Prepositions", extra: "preposizioni" },
  { id: "time", emoji: "🕐", label: "Numbers, Time, Days & Months", extra: "numbers-time" },
];

export function getTopic(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}

/** g018 is an older partial duplicate of g026 (both possessivi) — always skipped. */
export function topicRules(id: string) {
  return grammar.filter((r) => r.id !== "g018" && tagsMatchSubject(r.tags, id));
}

/** A topic is shown only if it has reference content (rules, tables, or a bespoke block). */
export function topicHasContent(t: Topic): boolean {
  return Boolean(t.extra) || (t.conjIds?.length ?? 0) > 0 || topicRules(t.id).length > 0;
}

export const VISIBLE_TOPICS = TOPICS.filter(topicHasContent);

export type TopicExercise = { slug: string; title: string; emoji: string; subtitle: string };

/** Drills that practise this topic (linked from the topic page's Practice section). */
export function exercisesForTopic(id: string): TopicExercise[] {
  return DRILLS.filter((d) => d.subjectId === id).map((d) => ({
    slug: d.slug,
    title: d.title,
    emoji: d.emoji,
    subtitle: d.subtitle,
  }));
}
