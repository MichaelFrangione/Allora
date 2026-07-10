import type { DrillQuestion } from "@/lib/content";
import {
  aggettiviDrill,
  alBarDrill,
  articoliDrill,
  concordanza,
  dimostrativiDrill,
  essereAvereDrill,
  genereDrill,
  gerundioDrill,
  interrogativiDrill,
  modalVerbs,
  passatoProssimoDrill,
  piacereDrill,
  pluraliDrill,
  possessiviDrill,
  preposizioniDrill,
  pronomiDrill,
  riflessiviDrill,
  ristoranteDrill,
  salutiDrill,
} from "@/lib/content";

/**
 * The single source of truth for every DrillQuiz-based topic drill.
 * Adding a topic = one JSON file + one entry here. The dynamic
 * /study/[slug] route, the Focused Drills list, the mistakes queue and
 * the contentType→subject mapping in progress.ts all derive from it.
 */
export type DrillDef = {
  /** URL slug: /study/<slug>. Usually equals contentType. */
  slug: string;
  /** contentType attempts are recorded under. */
  contentType: string;
  /** Learn-path subject this drill practises (drives mastery + typed mode). */
  subjectId?: string;
  title: string;
  subtitle: string;
  instructions: string;
  emoji: string;
  /** Short card description on the Focused Drills page. */
  desc: string;
  categoryLabels?: Record<string, string>;
  questions: DrillQuestion[];
};

export const DRILLS: DrillDef[] = [
  {
    slug: "saluti",
    contentType: "saluti",
    subjectId: "greetings",
    title: "Saluti",
    subtitle: "Greetings & farewells — ciao, buongiorno, arrivederci…",
    instructions:
      "Read the situation and choose the right Italian greeting or farewell for the time of day and level of formality.",
    emoji: "👋",
    desc: "Greetings & farewells — ciao, buongiorno, arrivederci",
    categoryLabels: { saluti: "Saluti (greetings)", congedi: "Congedi (farewells)" },
    questions: salutiDrill,
  },
  {
    slug: "interrogativi",
    contentType: "interrogativi",
    subjectId: "interrogatives",
    title: "Interrogativi",
    subtitle: "Question words — chi, cosa, come, quando, dove…",
    instructions:
      "Choose the correct Italian question word to complete each sentence (who, what, where, when, why, how, which, how much/many).",
    emoji: "❓",
    desc: "Question words — chi, cosa, come, quando, dove",
    categoryLabels: { scegli: "Completa la domanda", traduzione: "Traduzione" },
    questions: interrogativiDrill,
  },
  {
    slug: "dimostrativi",
    contentType: "dimostrativi",
    subjectId: "demonstratives",
    title: "Dimostrativi",
    subtitle: "This & that — questo, questa, quello, quelli…",
    instructions:
      "Pick the form of questo (this) or quello (that) that agrees with the noun's gender and number.",
    emoji: "👆",
    desc: "This & that — questo, quello, questi, quelli",
    categoryLabels: { "questo-quello": "Questo o Quello?", traduzione: "Traduzione" },
    questions: dimostrativiDrill,
  },
  {
    slug: "riflessivi",
    contentType: "riflessivi",
    subjectId: "reflexive-verbs",
    title: "Verbi Riflessivi",
    subtitle: "Reflexive verbs — mi sveglio, ti vesti, si diverte…",
    instructions:
      "Conjugate the reflexive verb for the given subject, or complete the daily-routine sentence with the right reflexive form (mi / ti / si / ci / vi / si).",
    emoji: "🔁",
    desc: "Reflexive verbs — mi sveglio, ti vesti, si diverte",
    categoryLabels: {
      coniugazione: "Coniugazione",
      "giornata-io": "La mia giornata (io)",
      "giornata-lui": "La sua giornata (lui/lei)",
    },
    questions: riflessiviDrill,
  },
  {
    slug: "pronomi",
    contentType: "pronomi",
    subjectId: "pronouns",
    title: "Pronomi",
    subtitle: "Subject, reflexive, direct- and indirect-object pronouns.",
    instructions:
      "Replace the highlighted noun with the correct pronoun, or choose the right subject, object, or reflexive pronoun for the sentence.",
    emoji: "👉",
    desc: "Subject, reflexive, direct- and indirect-object pronouns",
    categoryLabels: {
      soggetto: "Soggetto",
      "oggetto-diretto": "Oggetto Diretto",
      "oggetto-indiretto": "Oggetto Indiretto",
      riflessivi: "Riflessivi",
    },
    questions: pronomiDrill,
  },
  {
    slug: "essere-avere",
    contentType: "essere-avere",
    subjectId: "essere-avere",
    title: "Essere & Avere",
    subtitle: "The two key verbs — and idioms like avere fame, sete, sonno.",
    instructions:
      "Choose the correct present-tense form of essere or avere — or the right noun for an avere idiom (avere fame, sete, sonno…).",
    emoji: "🟰",
    desc: "The two key verbs, plus avere fame / sete / sonno",
    categoryLabels: {
      essere: "Essere",
      avere: "Avere",
      "espressioni-avere": "Espressioni con Avere",
    },
    questions: essereAvereDrill,
  },
  {
    slug: "passato-prossimo",
    contentType: "passato-prossimo",
    subjectId: "passato-prossimo",
    title: "Passato Prossimo",
    subtitle: "Talking about the past — ho mangiato, sono andato/a, mi sono svegliato",
    instructions:
      "The hint in parentheses after the blank tells you what to write: an infinitive means conjugate that verb — e.g. (io) ___ (comprare) → ho comprato — while 'avere o essere?' means just pick the auxiliary — e.g. (lui/lei) ___ (avere o essere?) incontrato → ha. Remember: essere for movement, reflexive and change-of-state verbs, and with essere the participle agrees (è andata, siamo andati).",
    emoji: "⏮️",
    desc: "The past tense — avere/essere + participle, irregular participles",
    categoryLabels: {
      ausiliare: "Avere o Essere?",
      forma: "Forma il passato prossimo",
      participio: "Participi irregolari",
    },
    questions: passatoProssimoDrill,
  },
  {
    slug: "articoli",
    contentType: "articoli",
    subjectId: "articles",
    title: "Articoli",
    subtitle: "Definite, indefinite, and partitive articles — il / lo / un / dei…",
    instructions:
      "Choose the correct article for each noun, based on its gender and the letter it starts with.",
    emoji: "📰",
    desc: "il / lo / un / dei — definite, indefinite, partitive",
    categoryLabels: {
      "determinativo-singolare": "Determinativo · Singolare",
      "determinativo-plurale": "Determinativo · Plurale",
      indeterminativo: "Indeterminativo",
      partitivo: "Partitivo (dei/degli/delle)",
    },
    questions: articoliDrill,
  },
  {
    slug: "genere",
    contentType: "genere",
    subjectId: "gender",
    title: "Il Genere dei Nomi",
    subtitle: "Masculine or feminine? Endings, exceptions, and tricky -ma / -ista nouns.",
    instructions:
      "Decide whether each noun is masculine or feminine (using its ending), and choose its article.",
    emoji: "⚥",
    desc: "Masculine or feminine — endings and exceptions",
    categoryLabels: {
      "maschile-o-femminile": "Maschile o Femminile?",
      "il-genere": "Il Genere",
      eccezioni: "Eccezioni",
    },
    questions: genereDrill,
  },
  {
    slug: "plurali",
    contentType: "plurali",
    subjectId: "plural",
    title: "Il Plurale dei Nomi",
    subtitle: "Regular, spelling-change, and irregular plurals — i libri, le amiche, le uova.",
    instructions:
      "Give the correct plural form of each noun — watch for spelling changes (-co/-go, -cia/-gia) and irregular plurals.",
    emoji: "➕",
    desc: "Regular, spelling-change, and irregular plurals",
    categoryLabels: {
      "plurale-regolare": "Regolare",
      "plurale-ortografia": "Ortografia (-co / -cia)",
      "plurale-irregolare": "Irregolare",
      invariabile: "Invariabile",
    },
    questions: pluraliDrill,
  },
  {
    slug: "aggettivi",
    contentType: "aggettivi",
    subjectId: "adjectives",
    title: "Gli Aggettivi",
    subtitle: "Agreement (-o / -a / -i / -e) plus the special forms of bello and buono.",
    instructions:
      "Choose the adjective form that agrees with the noun in gender and number, including the special forms of bello and buono.",
    emoji: "🎨",
    desc: "Agreement, plus bello and buono",
    categoryLabels: { concordanza: "Concordanza", bello: "Bello", buono: "Buono" },
    questions: aggettiviDrill,
  },
  {
    slug: "modal-verbs",
    contentType: "modal-verbs",
    subjectId: "modals",
    title: "Verbi Modali",
    subtitle: "Choose the correct form of dovere, potere, or volere.",
    instructions:
      "Pick the modal verb (must / can / want) and the form that matches the subject. Remember a modal is followed by the infinitive — e.g. Posso venire.",
    emoji: "🔧",
    desc: "Dovere, potere, volere — choose the right verb or form",
    categoryLabels: {
      "slide-9": "Quale verbo usi? (context)",
      "slide-10": "Completa con la forma corretta",
    },
    questions: modalVerbs,
  },
  {
    slug: "concordanza",
    contentType: "concordanza",
    subjectId: "adjectives",
    title: "La Concordanza",
    subtitle: "Pick the correct adjective form to match the noun.",
    instructions:
      "Choose the adjective ending that agrees with the noun in gender (m/f) and number (singular/plural) — e.g. la ragazza alta, i libri rossi.",
    emoji: "🎯",
    desc: "Pick the correct adjective form to match the noun",
    questions: concordanza,
  },
  {
    slug: "piacere",
    contentType: "piacere",
    subjectId: "piacere",
    title: "Piacere",
    subtitle: "Choose piace or piacciono — and form questions.",
    instructions:
      "Choose piace or piacciono depending on whether the thing liked is singular or plural, and use the right indirect pronoun.",
    emoji: "💚",
    desc: "Mi piace / mi piacciono — singular, plural, and questions",
    categoryLabels: {
      "piace-piacciono": "Piace o Piacciono?",
      "con-pronomi": "Con i Pronomi",
      "fare-domande": "Fare Domande",
    },
    questions: piacereDrill,
  },
  {
    slug: "preposizioni-articolate",
    contentType: "preposizioni",
    subjectId: "prepositions",
    title: "Preposizioni Articolate",
    subtitle: "Fill in the correct combined preposition + article.",
    instructions:
      "Combine the preposition with the article to fill the blank with the right contracted form (del, allo, nella, sui…).",
    emoji: "🔗",
    desc: "del / al / dal / nel / sul — fill in the right form",
    questions: preposizioniDrill,
  },
  {
    slug: "ristorante",
    contentType: "ristorante",
    title: "Al Ristorante",
    subtitle: "Complete the restaurant conversation.",
    instructions:
      "Complete each line of the restaurant conversation by choosing the word or phrase that fits.",
    emoji: "🍽️",
    desc: "Complete the restaurant conversation",
    questions: ristoranteDrill,
  },
  {
    slug: "al-bar",
    contentType: "al-bar",
    title: "Al Bar",
    subtitle: "ISC verbs and piacere translation exercises.",
    instructions:
      "Complete each bar-themed exercise — conjugate the -isc- verb or choose the correct piacere translation.",
    emoji: "☕",
    desc: "ISC verbs and piacere translation exercises",
    categoryLabels: {
      "verbi-isc": "Verbi in -ISC",
      "piacere-traduzione": "Traduci con Piacere",
    },
    questions: alBarDrill,
  },
  {
    slug: "possessivi",
    contentType: "possessivi",
    subjectId: "possessives",
    title: "Aggettivi Possessivi",
    subtitle: "Pick the correct possessive adjective — Simpsons edition.",
    instructions:
      "Pick the possessive (mio, tuo, suo…) that matches the owner and agrees with the thing owned — remember to drop the article with singular family members.",
    emoji: "👨‍👩‍👧",
    desc: "Mio / tuo / suo — possessive adjectives with family",
    questions: possessiviDrill,
  },
  {
    slug: "gerundio",
    contentType: "gerundio",
    subjectId: "gerundio",
    title: "Il Gerundio",
    subtitle: "-ando / -endo, stare + gerundio, and the four uses",
    instructions:
      "Form the gerund (-ARE → -ando, -ERE/-IRE → -endo), memorize the irregular forms (facendo, dicendo, bevendo…), use STARE + gerund for actions in progress (sto mangiando = I am eating), and recognise the four uses: simultaneity, manner, cause, condition.",
    emoji: "⏳",
    desc: "-ando / -endo, stare + gerundio, and the four uses",
    categoryLabels: {
      formazione: "Formazione (-ando / -endo)",
      irregolari: "Forme irregolari",
      progressivo: "Stare + gerundio",
      usi: "Usi del gerundio",
    },
    questions: gerundioDrill,
  },
];

const DRILL_BY_SLUG = new Map(DRILLS.map((d) => [d.slug, d]));

export function getDrill(slug: string): DrillDef | undefined {
  return DRILL_BY_SLUG.get(slug);
}

/** Drill questions keyed by contentType (for the mistakes queue). */
export const DRILL_QUESTIONS_BY_TYPE: Record<string, DrillQuestion[]> = Object.fromEntries(
  DRILLS.map((d) => [d.contentType, d.questions])
);

/** contentType → Learn-path subject for every registry drill that has one. */
export const DRILL_CONTENT_TYPE_SUBJECT: Record<string, string> = Object.fromEntries(
  DRILLS.filter((d) => d.subjectId).map((d) => [d.contentType, d.subjectId!])
);

/**
 * The Learn-path curriculum order — each subject maps to the route that
 * teaches it (registry drills and custom study modes alike). Roughly
 * ordered from foundational to more advanced.
 */
export const LEARN_PATH: { subjectId: string; route: string }[] = [
  { subjectId: "greetings", route: "/study/saluti" },
  { subjectId: "essere-avere", route: "/study/essere-avere" },
  { subjectId: "present-tense", route: "/study/conjugation" },
  { subjectId: "articles", route: "/study/articoli" },
  { subjectId: "gender", route: "/study/genere" },
  { subjectId: "plural", route: "/study/plurali" },
  { subjectId: "adjectives", route: "/study/aggettivi" },
  { subjectId: "possessives", route: "/study/possessivi" },
  { subjectId: "piacere", route: "/study/piacere" },
  { subjectId: "reflexive-verbs", route: "/study/riflessivi" },
  { subjectId: "modals", route: "/study/modal-verbs" },
  { subjectId: "pronouns", route: "/study/pronomi" },
  { subjectId: "prepositions", route: "/study/preposizioni-articolate" },
  { subjectId: "interrogatives", route: "/study/interrogativi" },
  { subjectId: "demonstratives", route: "/study/dimostrativi" },
  { subjectId: "time", route: "/study/time" },
  { subjectId: "gerundio", route: "/study/gerundio" },
  { subjectId: "passato-prossimo", route: "/study/passato-prossimo" },
];
