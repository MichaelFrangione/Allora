// Shared conjugation display: type + table renderer + badge label maps.
// Pure (no client hooks), so it works in both server components (vocab detail) and client
// components (the Add capture card).

export type ConjAux = "AVERE" | "ESSERE" | "BOTH";
export type AuxSource = "wiktionary" | "reflexive" | "curated";
export type Gender = "m" | "f" | "mf";

export type Conjugation = {
  aux: ConjAux;
  auxSource?: AuxSource;
  gerund: string | null;
  reflexive?: boolean;
  tenses: Record<string, Record<string, string>>;
};

export const AUX_LABEL: Record<ConjAux, string> = {
  AVERE: "avere",
  ESSERE: "essere",
  BOTH: "avere · essere",
};
export const AUX_TITLE: Record<AuxSource, string> = {
  wiktionary: "auxiliary from Wiktionary",
  reflexive: "reflexive verb → essere",
  curated: "best guess — please verify",
};
export const GENDER_LABEL: Record<Gender, string> = { m: "m", f: "f", mf: "m/f" };
export const GENDER_STYLE: Record<Gender, string> = {
  m: "border-blue-500 text-blue-600 dark:text-blue-400",
  f: "border-pink-500 text-pink-600 dark:text-pink-400",
  mf: "border-purple-500 text-purple-600 dark:text-purple-400",
};

const TENSE_ORDER = ["PRESENTE", "PASSATO_PROSSIMO", "IMPERFETTO", "FUTURO_SEMPLICE", "PROGRESSIVO"];
const TENSE_LABELS: Record<string, string> = {
  PRESENTE: "Presente",
  PASSATO_PROSSIMO: "Passato prossimo",
  IMPERFETTO: "Imperfetto",
  FUTURO_SEMPLICE: "Futuro semplice",
  PROGRESSIVO: "Progressivo",
};
const PERSON_ORDER = ["io", "tu", "lui", "noi", "voi", "loro"];
const PERSON_LABELS: Record<string, string> = {
  io: "io",
  tu: "tu",
  lui: "lui/lei",
  noi: "noi",
  voi: "voi",
  loro: "loro",
};

export function ConjugationTables({ conjugation }: { conjugation: Conjugation }) {
  return (
    <div className="space-y-3">
      {TENSE_ORDER.filter((t) => conjugation.tenses[t]).map((t) => (
        <div key={t}>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {TENSE_LABELS[t] ?? t}
          </div>
          <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm">
            {PERSON_ORDER.map((p) => (
              <div key={p} className="flex justify-between gap-2">
                <span className="text-muted-foreground">{PERSON_LABELS[p]}</span>
                <span className="font-medium text-right">{conjugation.tenses[t][p]}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
