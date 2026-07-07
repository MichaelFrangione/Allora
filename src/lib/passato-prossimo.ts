// Reference data + helpers for the Passato Prossimo section of the grammar Guide.
// Content is sourced from the class notes ("Il passato prossimo — teoria"): usage,
// regular participle formation, the avere/essere split, and the irregular participles.
// Kept as data (not JSX) so it can be unit-tested and rendered glanceably.

export const PRONOUNS = ["io", "tu", "lui/lei", "noi", "voi", "loro"] as const;
export const AVERE_PRESENT = ["ho", "hai", "ha", "abbiamo", "avete", "hanno"] as const;
export const ESSERE_PRESENT = ["sono", "sei", "è", "siamo", "siete", "sono"] as const;

export type Aux = "avere" | "essere";
export type PPVerb = { verb: string; meaning: string; aux: Aux; participle: string };

// "Quando si usa?" — time markers that pin an action to a finished moment.
export const TIME_MARKERS = [
  "ieri",
  "ieri mattina",
  "ieri sera",
  "oggi",
  "stamattina",
  "l'altro ieri",
  "la settimana scorsa",
  "martedì scorso",
  "l'anno scorso",
  "due anni fa",
  "tre settimane fa",
  "nel dicembre del 1992",
] as const;

export const USAGE_EXAMPLES: [string, string][] = [
  ["Sono arrivato a casa alle 18:30.", "I got home at 6:30."],
  ["Ieri ho mangiato una pizza.", "Yesterday I ate a pizza."],
  ["La settimana scorsa siamo andati al mare.", "Last week we went to the sea."],
];

// Regular participle: drop the infinitive ending, add the matching one.
export const REGULAR_PARTICIPLE: {
  ending: string;
  becomes: string;
  examples: [string, string][];
}[] = [
  { ending: "-are", becomes: "-ato", examples: [["mangiare", "mangiato"], ["parlare", "parlato"], ["andare", "andato"]] },
  { ending: "-ere", becomes: "-uto", examples: [["credere", "creduto"], ["vendere", "venduto"], ["sapere", "saputo"]] },
  { ending: "-ire", becomes: "-ito", examples: [["sentire", "sentito"], ["dormire", "dormito"], ["partire", "partito"]] },
];

// Full example conjugations shown as tables (both auxiliaries).
export const AVERE_VERBS: PPVerb[] = [
  { verb: "mangiare", meaning: "to eat", aux: "avere", participle: "mangiato" },
  { verb: "credere", meaning: "to believe", aux: "avere", participle: "creduto" },
  { verb: "dormire", meaning: "to sleep", aux: "avere", participle: "dormito" },
];
export const ESSERE_VERBS: PPVerb[] = [
  { verb: "andare", meaning: "to go", aux: "essere", participle: "andato" },
  { verb: "partire", meaning: "to leave", aux: "essere", participle: "partito" },
];

// Avere: transitive verbs — they answer "chi? / che cosa?". Participle stays -o.
export const AVERE_EXAMPLES: [string, string][] = [
  ["Ho mangiato un panino.", "I ate a sandwich."],
  ["Hai incontrato Marco.", "You met Marco."],
  ["Abbiamo sentito un rumore.", "We heard a noise."],
];

// Essere: verbs that do NOT answer "chi? / che cosa?" — four groups. Participle agrees.
export const ESSERE_GROUPS: { label: string; note: string; verbs: string[] }[] = [
  { label: "Movimento", note: "movement", verbs: ["andare", "venire", "arrivare", "partire", "tornare", "uscire", "entrare"] },
  { label: "Riflessivi", note: "reflexive", verbs: ["svegliarsi", "alzarsi", "lavarsi", "vestirsi"] },
  { label: "Cambiamento", note: "change of state", verbs: ["nascere", "morire", "diventare", "crescere", "cambiare"] },
  { label: "Piacere", note: "and similar", verbs: ["piacere", "dispiacere"] },
];
export const ESSERE_EXAMPLES: [string, string][] = [
  ["Sono andato / andata a casa.", "I went home. (m. / f.)"],
  ["Ci siamo svegliate presto.", "We woke up early. (f.)"],
  ["Siete cambiati molto.", "You have changed a lot."],
  ["Mi è piaciuta la cena.", "I liked the dinner."],
];

// Irregular past participles grouped by ending, exactly as taught in class.
export const IRREGULAR_GROUPS: { ending: string; pairs: [string, string][] }[] = [
  { ending: "-tto", pairs: [["fare", "fatto"], ["dire", "detto"], ["leggere", "letto"], ["scrivere", "scritto"], ["rompere", "rotto"], ["tradurre", "tradotto"], ["produrre", "prodotto"], ["correggere", "corretto"], ["friggere", "fritto"]] },
  { ending: "-so", pairs: [["prendere", "preso"], ["accendere", "acceso"], ["perdere", "perso"], ["scendere", "sceso"], ["decidere", "deciso"]] },
  { ending: "-nto", pairs: [["piangere", "pianto"], ["spegnere", "spento"], ["vincere", "vinto"], ["spingere", "spinto"], ["dipingere", "dipinto"]] },
  { ending: "-rto", pairs: [["aprire", "aperto"], ["coprire", "coperto"], ["scoprire", "scoperto"], ["morire", "morto"], ["soffrire", "sofferto"]] },
  { ending: "-uto", pairs: [["piacere", "piaciuto"], ["dispiacere", "dispiaciuto"], ["conoscere", "conosciuto"], ["bere", "bevuto"]] },
  { ending: "-sto", pairs: [["rimanere", "rimasto"], ["chiedere", "chiesto"], ["vedere", "visto"], ["rispondere", "risposto"]] },
  { ending: "-ss-", pairs: [["mettere", "messo"], ["permettere", "permesso"], ["succedere", "successo"], ["vivere", "vissuto"]] },
];

/**
 * Build a full passato prossimo conjugation (6 persons).
 * With avere the participle is invariable. With essere it agrees with the subject:
 * singular persons show "-o/a", plural persons "-i/e" (e.g. "sono andato/a", "siamo andati/e").
 */
export function conjugatePP({ aux, participle }: { aux: Aux; participle: string }): string[] {
  const auxForms = aux === "avere" ? AVERE_PRESENT : ESSERE_PRESENT;
  if (aux === "avere") return auxForms.map((a) => `${a} ${participle}`);

  const { singular, plural } = agreementForms(participle);
  // io, tu, lui/lei → singular; noi, voi, loro → plural
  return auxForms.map((a, i) => `${a} ${i < 3 ? singular : plural}`);
}

/** Past-participle agreement forms for an essere verb, e.g. andato → o/a/i/e. */
export function agreementForms(participle: string): {
  singular: string; // "andato/a"
  plural: string; // "andati/e"
  mSing: string;
  fSing: string;
  mPlur: string;
  fPlur: string;
} {
  const base = participle.replace(/o$/, ""); // "andato" → "andat"
  return {
    singular: `${base}o/a`,
    plural: `${base}i/e`,
    mSing: `${base}o`,
    fSing: `${base}a`,
    mPlur: `${base}i`,
    fPlur: `${base}e`,
  };
}
