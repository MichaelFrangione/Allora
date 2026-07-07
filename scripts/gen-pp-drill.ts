/**
 * Generate data/passato-prossimo-drill.json (DrillQuestion[]) from the conjugation engine.
 * Three categories: ausiliare (avere vs essere), forma (full passato prossimo), participio
 * (irregular past participles). Run once, commit the JSON:  npx tsx scripts/gen-pp-drill.ts
 */
import { conjugate, verbClass } from "../src/lib/conjugate";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

type Q = {
  id: string;
  category: string;
  sentence: string;
  hint?: string;
  correct: string;
  options: string[];
  explanation?: string;
  tags: string[];
};

const PLABEL: Record<string, string> = { io: "io", tu: "tu", lui: "lui/lei", noi: "noi", voi: "voi", loro: "loro" };
const AVERE: Record<string, string> = { io: "ho", tu: "hai", lui: "ha", noi: "abbiamo", voi: "avete", loro: "hanno" };
const ESSERE: Record<string, string> = { io: "sono", tu: "sei", lui: "è", noi: "siamo", voi: "siete", loro: "sono" };
const REFL: Record<string, string> = { io: "mi", tu: "ti", lui: "si", noi: "ci", voi: "vi", loro: "si" };

function participle(verb: string): string | null {
  const c = conjugate(verb);
  if (!c) return null;
  return c.tenses.PASSATO_PROSSIMO.io.split(" ").pop() ?? null; // masc singular
}

function regularParticiple(verb: string): string {
  const base = verb.endsWith("si") ? verb.replace(/si$/, "e") : verb;
  const stem = base.slice(0, -3);
  const end = base.slice(-3);
  if (end === "are") return stem + "ato";
  if (end === "ere") return stem + "uto";
  if (end === "ire") return stem + "ito";
  return base;
}

// Dedupe, cap at 4, and rotate so the correct answer isn't always first.
function arrange(correct: string, distractors: string[], idx: number): string[] {
  const all = Array.from(new Set([correct, ...distractors.filter(Boolean)])).slice(0, 4);
  const shift = idx % all.length;
  return all.slice(shift).concat(all.slice(0, shift));
}

const questions: Q[] = [];
let n = 0;
const id = () => `pp${String(++n).padStart(3, "0")}`;

// ---- ausiliare: avere vs essere ----
const AUX_VERBS: [string, string[]][] = [
  ["mangiare", ["io", "lui"]], ["parlare", ["tu"]], ["comprare", ["noi"]], ["credere", ["lui"]],
  ["capire", ["io"]], ["sentire", ["voi"]], ["incontrare", ["lui"]], ["ricevere", ["tu"]],
  ["andare", ["io", "lui"]], ["partire", ["noi"]], ["arrivare", ["loro"]], ["uscire", ["tu"]],
  ["tornare", ["lui"]], ["nascere", ["io"]], ["diventare", ["lei" in {} ? "lui" : "lui"]], ["cadere", ["lui"]],
  ["svegliarsi", ["io"]], ["divertirsi", ["noi"]],
];
for (const [verb, persons] of AUX_VERBS) {
  const c = conjugate(verb);
  if (!c || c.aux === "BOTH") continue;
  const essere = c.aux === "ESSERE";
  const part = participle(verb)!;
  for (const p of persons) {
    const correct = (essere ? ESSERE : AVERE)[p];
    const wrong = (essere ? AVERE : ESSERE)[p];
    const pron = c.reflexive ? REFL[p] + " " : "";
    questions.push({
      id: id(),
      category: "ausiliare",
      sentence: `(${PLABEL[p]}) ${pron}___ ${part}.`,
      hint: `${verb} → ausiliare?`,
      correct,
      options: arrange(correct, [wrong, (essere ? ESSERE : AVERE)["lui"], (essere ? AVERE : ESSERE)["tu"]], n),
      explanation: `${verb} → ${essere ? "essere" : "avere"}${c.reflexive ? " (verbo riflessivo → sempre essere)" : essere ? " (movimento/cambiamento)" : " (verbo transitivo)"}.`,
      tags: ["passato-prossimo", "ausiliare"],
    });
  }
}

// ---- forma: full passato prossimo ----
const FORM_VERBS: [string, string][] = [
  ["mangiare", "io"], ["rompere", "io"], ["scrivere", "lui"], ["prendere", "noi"],
  ["andare", "lui"], ["partire", "loro"], ["fare", "io"], ["dire", "tu"],
  ["leggere", "io"], ["svegliarsi", "io"], ["vedere", "noi"], ["venire", "lui"],
];
for (const [verb, p] of FORM_VERBS) {
  const c = conjugate(verb);
  if (!c) continue;
  const correct = c.tenses.PASSATO_PROSSIMO[p];
  const words = correct.split(" ");
  const essere = c.aux === "ESSERE";
  const otherAux = (essere ? AVERE : ESSERE)[p];
  // swap the auxiliary word (index depends on reflexive pronoun)
  const auxIdx = c.reflexive ? 1 : 0;
  const wrongAuxWords = [...words];
  wrongAuxWords[auxIdx] = otherAux;
  const wrongAuxForm = wrongAuxWords.join(" ");
  // regular participle if this verb is irregular
  let regForm = "";
  if (verbClass(verb) === "irregular") {
    const rw = [...words];
    rw[rw.length - 1] = regularParticiple(verb);
    regForm = rw.join(" ");
  }
  questions.push({
    id: id(),
    category: "forma",
    sentence: `(${PLABEL[p]}) ___  — ${verb}`,
    hint: `${verb} → passato prossimo, ${PLABEL[p]}`,
    correct,
    options: arrange(correct, [wrongAuxForm, regForm, c.tenses.PASSATO_PROSSIMO[p === "io" ? "tu" : "io"]], n),
    explanation: `${verb}, ${PLABEL[p]} → ${correct}.`,
    tags: ["passato-prossimo", "forma"],
  });
}

// ---- participio: irregular past participles ----
const PART_VERBS = [
  "fare", "dire", "leggere", "scrivere", "rompere", "prendere", "chiedere", "vedere",
  "mettere", "aprire", "bere", "vincere", "decidere", "rispondere", "chiudere", "venire",
  "rimanere", "perdere", "spegnere", "vivere",
];
const partData = PART_VERBS.map((v) => ({ v, part: participle(v) })).filter(
  (x): x is { v: string; part: string } => !!x.part && verbClass(x.v) === "irregular",
);
const allParts = partData.map((x) => x.part);
partData.forEach((x, i) => {
  // Distractors: the regularized form + two REAL participles from other verbs (all real words).
  const others = allParts.filter((p) => p !== x.part);
  const d1 = others[i % others.length];
  const d2 = others[(i + 5) % others.length];
  questions.push({
    id: id(),
    category: "participio",
    sentence: `Il participio passato di «${x.v}» è ___`,
    hint: "participio irregolare",
    correct: x.part,
    options: arrange(x.part, [regularParticiple(x.v), d1, d2], n),
    explanation: `${x.v} → ${x.part} (participio irregolare).`,
    tags: ["passato-prossimo", "participio"],
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// July 7 class worksheet ("Esercizi progressivi sul Passato Prossimo").
// Sentences are copied verbatim from the sheet; answers are engine-computed
// (with the 3 overrides below) so the Italian stays correct. Appended after the
// engine-generated set so existing ids pp001–051 stay stable (progress history).
// ═══════════════════════════════════════════════════════════════════════════

// Engine gaps: essere/avere can't self-conjugate their participle, and the engine
// prefers the archaic "veduto" over the "visto" the class teaches.
const PART_OVERRIDE: Record<string, string> = { essere: "stato", avere: "avuto", vedere: "visto" };

function participleOf(verb: string): string {
  return PART_OVERRIDE[verb] ?? participle(verb) ?? regularParticiple(verb);
}
function auxOf(verb: string): "AVERE" | "ESSERE" {
  if (verb === "essere" || verb === "stare") return "ESSERE";
  if (verb === "avere") return "AVERE";
  const c = conjugate(verb);
  return c && c.aux === "ESSERE" ? "ESSERE" : "AVERE";
}
function ppForm(verb: string, person: string): string {
  const auxWord = (auxOf(verb) === "ESSERE" ? ESSERE : AVERE)[person];
  return `${auxWord} ${participleOf(verb)}`; // masc singular (used for "io")
}

// A: participio passato — sentence context. [sentence, infinitive]
const SHEET_PARTICIPI: [string, string][] = [
  ["Piero ha ___ una mela.", "mangiare"],
  ["Maria ha ___ con Silvia.", "parlare"],
  ["Carmine ha ___ gli Stati Uniti.", "visitare"],
  ["Sandro ha ___ a calcio.", "giocare"],
  ["Felice è ___ ieri.", "arrivare"],
  ["Dove sei ___?", "andare"],
  ["Giorgio ha ___ un regalo a Silvia.", "dare"],
  ["Carlo è ___.", "uscire"],
  ["Carmela ha ___ di parlare.", "finire"],
  ["Nicola è ___ in autobus.", "salire"],
  ["Giovanni ha ___ la sua camera.", "pulire"],
  ["Grazia non ha ___ niente!", "capire"],
  ["Francesco non ha ___ niente.", "sentire"],
  ["Gigi ha ___ la sua macchina.", "vendere"],
  ["Beatrice ha ___ lavorare.", "dovere"],
  ["Alessandro ha ___ una notizia.", "sapere"],
  ["Dora ha ___ dormire.", "potere"],
  ["Andrea ha ___ molto sport.", "fare"],
  ["Ho ___ la porta.", "chiudere"],
  ["Hai ___ troppa birra?", "bere"],
  ["Marco ha ___ la porta.", "aprire"],
  ["Ho ___ il piatto sul tavolo.", "mettere"],
  ["Abbiamo ___ un gelato.", "chiedere"],
  ["Abbiamo ___ un gelato alla fragola.", "scegliere"],
  ["Avete ___ di uscire.", "decidere"],
  ["Perché hai ___ il bicchiere?", "rompere"],
  ["Luigi è ___ dalla macchina.", "scendere"],
  ["Giorgio è ___ malato.", "essere"],
  ["Federico ha ___ la macchina.", "prendere"],
  ["Hai ___ quella lettera?", "scrivere"],
  ["Quando sei ___?", "nascere"],
  ["Giovanni è ___ a cena ieri sera.", "venire"],
  ["Mio zio è ___ ieri.", "morire"],
  ["Davide ha ___ in Spagna.", "vivere"],
  ["Daniele è ___ in Australia.", "rimanere"],
  ["Hai ___ una bugia.", "dire"],
  ["Ho ___ al telefono.", "rispondere"],
  ["A Roma, abbiamo ___ il colosseo.", "vedere"],
  ["Hanno ___ i loro quaderni.", "perdere"],
  ["Che cosa è ___?", "succedere"],
  ["L'Italia ha ___ la coppa del mondo.", "vincere"],
  ["Ho ___ un libro interessante.", "leggere"],
  ["Abbiamo ___ troppi soldi in vacanza.", "spendere"],
];
// Pool of real participles for plausible distractors.
const PART_POOL = Array.from(new Set(SHEET_PARTICIPI.map(([, v]) => participleOf(v))));
SHEET_PARTICIPI.forEach(([sentence, verb], i) => {
  const correct = participleOf(verb);
  const reg = regularParticiple(verb);
  const others = PART_POOL.filter((p) => p !== correct);
  questions.push({
    id: id(),
    category: "participio",
    sentence,
    hint: `${verb} → participio`,
    correct,
    options: arrange(correct, [reg !== correct ? reg : "", others[i % others.length], others[(i + 7) % others.length]], n),
    explanation: `${verb} → ${correct}${reg !== correct ? " (participio irregolare)" : ""}.`,
    tags: ["passato-prossimo", "participio"],
  });
});

// B: quale ausiliare? [sentence (aux blanked), infinitive, person]
const SHEET_AUX: [string, string, string][] = [
  ["(io) ___ fatto la spesa.", "fare", "io"],
  ["(noi) ___ arrivati ieri.", "arrivare", "noi"],
  ["Piero ___ mangiato una mela.", "mangiare", "lui"],
  ["Piero e Maria ___ partiti stamattina.", "partire", "loro"],
  ["(noi) ___ letto un bel libro.", "leggere", "noi"],
  ["Voi, quando ___ usciti?", "uscire", "voi"],
  ["I ragazzi ___ preso un caffè.", "prendere", "loro"],
  ["Piero ___ andato a Roma.", "andare", "lui"],
  ["(io) ___ venuto in macchina.", "venire", "io"],
  ["Tu, ___ avuto il tuo regalo?", "avere", "tu"],
  ["(voi) ___ finito di parlare.", "finire", "voi"],
  ["Tu, quando ___ nato?", "nascere", "tu"],
  ["Ti ___ piaciuto il film?", "piacere", "lui"],
  ["Tu, perché ___ rimasto a casa?", "rimanere", "tu"],
  ["(noi) ___ visto un bel film.", "vedere", "noi"],
  ["Mario ___ sceso dal treno.", "scendere", "lui"],
  ["(io) ___ offerto un regalo al mio amico.", "offrire", "io"],
  ["(voi) ___ stati in Italia?", "essere", "voi"],
  ["Le ragazze ___ arrivate a casa.", "arrivare", "loro"],
  ["(voi) ___ bevuto del vino rosso.", "bere", "voi"],
  ["Tu, perché ___ deciso di uscire?", "decidere", "tu"],
  ["Carlo ___ ricevuto una lettera.", "ricevere", "lui"],
  ["(noi) ___ diventati amici.", "diventare", "noi"],
  ["(io) ___ salito in macchina.", "salire", "io"],
];
SHEET_AUX.forEach(([sentence, verb, p], i) => {
  const essere = auxOf(verb) === "ESSERE";
  const correct = (essere ? ESSERE : AVERE)[p];
  const wrong = (essere ? AVERE : ESSERE)[p];
  questions.push({
    id: id(),
    category: "ausiliare",
    sentence,
    hint: `${verb} → ausiliare?`,
    correct,
    options: arrange(correct, [wrong, (essere ? ESSERE : AVERE)["lui"], (essere ? AVERE : ESSERE)["tu"]], i + 1),
    explanation: `${verb} → ${essere ? "essere" : "avere"} → ${correct}.`,
    tags: ["passato-prossimo", "ausiliare"],
  });
});

// C: passato prossimo alla prima persona (io). [sentence, infinitive]
const SHEET_IO: [string, string][] = [
  ["(io) ___ un esame.", "avere"],
  ["(io) ___ delle caramelle.", "comprare"],
  ["(io) ___ in città.", "andare"],
  ["(io) ___ con mio padre.", "parlare"],
  ["(io) ___ a Roma.", "nascere"],
  ["(io) ___ una bella donna.", "conoscere"],
  ["(io) ___ a casa.", "rimanere"],
  ["(io) ___ il sole.", "prendere"],
  ["(io) ___ in casa.", "entrare"],
  ["(io) ___ della ginnastica.", "fare"],
  ["(io) ___ di casa presto.", "uscire"],
  ["(io) ___ a casa tardi.", "tornare"],
  ["(io) ___ a calcio.", "giocare"],
  ["(io) ___ alle otto.", "partire"],
  ["(io) ___ la macchina.", "vendere"],
  ["(io) ___ i compiti.", "finire"],
  ["(io) ___ lungo la spiaggia.", "camminare"],
  ["(io) ___ in vacanza.", "essere"],
  ["(io) ___ una mano a Silvia.", "dare"],
  ["(io) ___ un'amica.", "incontrare"],
  ["(io) ___ da Firenze.", "ritornare"],
];
SHEET_IO.forEach(([sentence, verb], i) => {
  const correct = ppForm(verb, "io");
  const essere = auxOf(verb) === "ESSERE";
  const wrongAux = `${(essere ? AVERE : ESSERE)["io"]} ${participleOf(verb)}`; // swapped auxiliary
  const regForm = verbClass(verb) === "irregular" ? `${(essere ? ESSERE : AVERE)["io"]} ${regularParticiple(verb)}` : "";
  const otherPerson = ppForm(verb, "tu");
  questions.push({
    id: id(),
    category: "forma",
    sentence,
    hint: `${verb} → io`,
    correct,
    options: arrange(correct, [wrongAux, regForm, otherPerson], i + 1),
    explanation: `${verb}, io → ${correct}.`,
    tags: ["passato-prossimo", "forma"],
  });
});

const out = join(process.cwd(), "data", "passato-prossimo-drill.json");
writeFileSync(out, JSON.stringify(questions, null, 2) + "\n");
console.log(`Wrote ${questions.length} questions to ${out}`);
console.log("By category:", questions.reduce((m: Record<string, number>, q) => ((m[q.category] = (m[q.category] || 0) + 1), m), {}));
