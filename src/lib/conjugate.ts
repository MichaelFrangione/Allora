// Server-side conjugation via `italian-verbs` (+ `italian-verbs-dict`). No LLM, no network.
// Produces a compact set of tenses + gerund + progressive + a best-effort auxiliary. Reflexive
// verbs (-si) aren't in the dictionary, so they're handled by conjugating the base verb and
// decorating with reflexive pronouns. The dict is ~7MB JSON — keep this out of client bundles.
import {
  getConjugation,
  type ItalianTense,
  type Person,
  type Numbers,
  type ItalianAux,
} from "italian-verbs";
import type { VerbsInfo } from "italian-verbs-dict";
import verbsDict from "italian-verbs-dict/dist/verbs.json";

const DICT = verbsDict as unknown as VerbsInfo;

const norm = (s: string) => s.toLowerCase().trim();
const inDict = (v: string) => Object.prototype.hasOwnProperty.call(DICT, v);
/** Reflexive infinitive -> base infinitive: lavarsi -> lavare, mettersi -> mettere. */
const reflexiveBase = (v: string) => v.replace(/si$/, "e");

/** io/tu/lui/noi/voi/loro, in order, mapped to the lib's person+number. */
const PERSONS: { key: string; person: Person; number: Numbers }[] = [
  { key: "io", person: 1, number: "S" },
  { key: "tu", person: 2, number: "S" },
  { key: "lui", person: 3, number: "S" },
  { key: "noi", person: 1, number: "P" },
  { key: "voi", person: 2, number: "P" },
  { key: "loro", person: 3, number: "P" },
];

const REFLEXIVE_PRONOUNS: Record<string, string> = {
  io: "mi", tu: "ti", lui: "si", noi: "ci", voi: "vi", loro: "si",
};

/** Simple tenses (no auxiliary needed). */
const SIMPLE_TENSES: ItalianTense[] = ["PRESENTE", "IMPERFETTO", "FUTURO_SEMPLICE"];

/** "Aux" is not in the dictionary, so these are curated. Reflexives (-si) always take essere. */
const ESSERE_VERBS = new Set([
  "andare", "arrivare", "bastare", "cadere", "capitare", "accadere", "avvenire", "succedere",
  "costare", "crescere", "dimagrire", "dispiacere", "diventare", "divenire", "durare", "entrare",
  "esistere", "fuggire", "giungere", "aggiungere", "importare", "mancare", "morire", "nascere",
  "occorrere", "parere", "partire", "piacere", "restare", "rientrare", "rimanere", "ripartire",
  "risultare", "ritornare", "riuscire", "scappare", "sembrare", "sorgere", "sparire", "apparire",
  "comparire", "scomparire", "stare", "tornare", "uscire", "venire", "provenire", "intervenire",
  "sopravvivere",
]);

/** Verbs that take avere OR essere depending on transitive/intransitive use. */
const DUAL_VERBS = new Set([
  "correre", "saltare", "volare", "cambiare", "cominciare", "finire", "passare", "salire",
  "scendere", "suonare", "vivere", "aumentare", "diminuire", "migliorare", "peggiorare",
  "invecchiare", "guarire", "procedere", "servire", "trascorrere",
]);

export type ConjAux = "AVERE" | "ESSERE" | "BOTH";
/** Where the auxiliary came from: authoritative (Wiktionary), rule (reflexive → essere), or guess. */
export type AuxSource = "wiktionary" | "reflexive" | "curated";

export type ConjugationTables = {
  /** avere / essere / both. */
  aux: ConjAux;
  /** provenance of `aux` — "curated" is a best-effort guess worth verifying. */
  auxSource: AuxSource;
  /** gerund, e.g. "rompendo" (null if not derivable). */
  gerund: string | null;
  /** true if this is a reflexive verb (forms carry mi/ti/si/…). */
  reflexive: boolean;
  /** tense key -> { io, tu, lui, noi, voi, loro } */
  tenses: Record<string, Record<string, string>>;
};

/** True if the infinitive is a known Italian verb (including reflexives whose base is known). */
export function isItalianVerb(infinitive: string): boolean {
  const v = norm(infinitive);
  if (inDict(v)) return true;
  if (v.endsWith("si")) return inDict(reflexiveBase(v));
  return false;
}

/** "-are" | "-ere" | "-ire" (handles reflexive -si), or null. */
export function verbGroupOf(infinitive: string): string | null {
  const v = norm(infinitive);
  const base = v.endsWith("si") ? reflexiveBase(v) : v;
  if (base.endsWith("are")) return "-are";
  if (base.endsWith("ere")) return "-ere";
  if (base.endsWith("ire")) return "-ire";
  return null;
}

/** Curated auxiliary: reflexive/essere-verbs → ESSERE, dual-use → BOTH, else AVERE. */
export function auxOf(infinitive: string): ConjAux {
  const v = norm(infinitive);
  if (v.endsWith("si")) return "ESSERE";
  if (ESSERE_VERBS.has(v)) return "ESSERE";
  if (DUAL_VERBS.has(v)) return "BOTH";
  return "AVERE";
}

/** Clean gerund of a base verb. The dict stores "rompendosi" (enclitic attached); truncate at -ndo. */
function gerundOf(base: string): string | null {
  const raw = (DICT as unknown as Record<string, { ger?: { pres?: string } }>)[base]?.ger?.pres;
  if (raw) {
    const clean = raw.replace(/ndo.*/, "ndo");
    if (clean.endsWith("ndo")) return clean;
  }
  if (base.endsWith("are")) return base.slice(0, -3) + "ando";
  if (base.endsWith("ere") || base.endsWith("ire")) return base.slice(0, -3) + "endo";
  return null;
}

/**
 * Conjugate common tenses + gerund + progressive, or null if the word isn't a known verb.
 * `opts.aux` (e.g. from Wiktionary) overrides the curated guess for non-reflexive verbs.
 */
export function conjugate(infinitive: string, opts?: { aux?: ConjAux }): ConjugationTables | null {
  const input = norm(infinitive);
  const reflexive = input.endsWith("si");
  const base = reflexive ? reflexiveBase(input) : input;
  if (!inDict(base)) return null;

  let aux: ConjAux;
  let auxSource: AuxSource;
  if (reflexive) {
    aux = "ESSERE"; // reflexives always take essere
    auxSource = "reflexive";
  } else if (opts?.aux) {
    aux = opts.aux;
    auxSource = "wiktionary";
  } else {
    aux = auxOf(input);
    auxSource = "curated";
  }

  const gerund = gerundOf(base);
  const tenses: Record<string, Record<string, string>> = {};

  try {
    for (const tense of SIMPLE_TENSES) {
      const row: Record<string, string> = {};
      for (const p of PERSONS) row[p.key] = getConjugation(DICT, base, tense, p.person, p.number, undefined);
      tenses[tense] = row;
    }

    // Passato prossimo with the detected auxiliary (essere agrees the participle).
    const ppAux: ItalianAux = aux === "ESSERE" ? "ESSERE" : "AVERE";
    const pp: Record<string, string> = {};
    for (const p of PERSONS) {
      pp[p.key] = getConjugation(DICT, base, "PASSATO_PROSSIMO", p.person, p.number, {
        aux: ppAux,
        agreeGender: ppAux === "ESSERE" ? "M" : undefined,
        agreeNumber: ppAux === "ESSERE" ? p.number : undefined,
      });
    }
    tenses["PASSATO_PROSSIMO"] = pp;

    // Presente progressivo: stare (present) + gerund.
    if (gerund) {
      const prog: Record<string, string> = {};
      for (const p of PERSONS) {
        const stare = getConjugation(DICT, "stare", "PRESENTE", p.person, p.number, undefined);
        prog[p.key] = `${stare} ${gerund}`;
      }
      tenses["PROGRESSIVO"] = prog;
    }

    // Decorate reflexive forms with the pronoun: "mi lavo", "mi sono lavato", "mi sto lavando".
    if (reflexive) {
      for (const tense of Object.keys(tenses)) {
        for (const p of PERSONS) {
          tenses[tense][p.key] = `${REFLEXIVE_PRONOUNS[p.key]} ${tenses[tense][p.key]}`;
        }
      }
    }
  } catch {
    if (Object.keys(tenses).length === 0) return null;
  }

  return { aux, auxSource, gerund, reflexive, tenses };
}
