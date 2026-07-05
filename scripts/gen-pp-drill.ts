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

const out = join(process.cwd(), "data", "passato-prossimo-drill.json");
writeFileSync(out, JSON.stringify(questions, null, 2) + "\n");
console.log(`Wrote ${questions.length} questions to ${out}`);
console.log("By category:", questions.reduce((m: Record<string, number>, q) => ((m[q.category] = (m[q.category] || 0) + 1), m), {}));
