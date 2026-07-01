"use client";

import { useRef, useState } from "react";
import { Volume2, Trash2, ChevronDown, Plus, Search, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSpeech } from "@/lib/useSpeech";

type Subject = { id: string; label: string; emoji: string };

type ConjAux = "AVERE" | "ESSERE" | "BOTH";
type AuxSource = "wiktionary" | "reflexive" | "curated";
type Gender = "m" | "f" | "mf";
type Conjugation = {
  aux: ConjAux;
  auxSource?: AuxSource;
  gerund: string | null;
  reflexive?: boolean;
  tenses: Record<string, Record<string, string>>;
};
type DedupWhere = "content" | "staged" | "promoted";

export type StagedEntry = {
  id: string;
  italian: string;
  english: string;
  partOfSpeech: string | null;
  gender: string | null;
  verbGroup: string | null;
  tags: string[];
  conjugation: Conjugation | null;
  example: string | null;
  status: string;
  createdAt: string;
};

type LookupResult = {
  italian: string;
  english: string;
  englishSource: "input" | "wiktionary" | null;
  isVerb: boolean;
  partOfSpeech: string | null;
  verbGroup: string | null;
  gender: Gender | null;
  conjugation: Conjugation | null;
  already: { exists: boolean; where: DedupWhere | null };
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
  io: "io", tu: "tu", lui: "lui/lei", noi: "noi", voi: "voi", loro: "loro",
};
const AUX_LABEL: Record<ConjAux, string> = { AVERE: "avere", ESSERE: "essere", BOTH: "avere · essere" };
const AUX_TITLE: Record<AuxSource, string> = {
  wiktionary: "auxiliary from Wiktionary",
  reflexive: "reflexive verb → essere",
  curated: "best guess — please verify",
};
const GENDER_LABEL: Record<Gender, string> = { m: "m", f: "f", mf: "m/f" };
const GENDER_STYLE: Record<Gender, string> = {
  m: "border-blue-500 text-blue-600 dark:text-blue-400",
  f: "border-pink-500 text-pink-600 dark:text-pink-400",
  mf: "border-purple-500 text-purple-600 dark:text-purple-400",
};
const WHERE_LABEL: Record<DedupWhere, string> = {
  content: "the app's vocab",
  staged: "your staged list",
  promoted: "the app's vocab",
};

function defaultSubjectFor(r: LookupResult): string {
  if (r.conjugation?.reflexive) return "reflexive-verbs";
  if (r.isVerb) return "present-tense";
  return "";
}

export default function AddVocab({
  initialStaged,
  subjects,
}: {
  initialStaged: StagedEntry[];
  subjects: Subject[];
}) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [englishDraft, setEnglishDraft] = useState("");
  const [subject, setSubject] = useState("");
  const [looking, setLooking] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staged, setStaged] = useState<StagedEntry[]>(initialStaged);
  const searchRef = useRef<HTMLInputElement>(null);

  async function lookup() {
    const word = query.trim();
    if (!word || looking) return;
    setLooking(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/vocab/lookup?word=${encodeURIComponent(word)}`);
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "Lookup failed");
      }
      const data = (await res.json()) as LookupResult;
      setResult(data);
      setEnglishDraft(data.english ?? "");
      setSubject(defaultSubjectFor(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLooking(false);
    }
  }

  async function add() {
    if (!result || adding || result.already.exists) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/vocab/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ italian: result.italian, english: englishDraft.trim(), subject }),
      });
      if (res.status === 409) {
        const b = await res.json().catch(() => ({}));
        setResult({ ...result, already: { exists: true, where: b.where ?? "staged" } });
        return;
      }
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "Could not add word");
      }
      const entry = (await res.json()) as StagedEntry;
      setStaged((prev) => [entry, ...prev]);
      setResult(null);
      setQuery("");
      setEnglishDraft("");
      setSubject("");
      searchRef.current?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    const prev = staged;
    setStaged((s) => s.filter((e) => e.id !== id));
    const res = await fetch(`/api/vocab/capture?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) setStaged(prev);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-28 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Add vocab</h1>
        <p className="text-sm text-muted-foreground">
          Look up a word, then tap <Plus className="inline h-3.5 w-3.5" /> to add it. Verbs show the
          auxiliary, gerund and progressive. Staged words are shared and promoted into the app later.
        </p>
      </header>

      <div className="flex gap-2">
        <Input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              lookup();
            }
          }}
          placeholder="Look up a word, e.g. rompere"
          autoFocus
          aria-label="Word to look up"
        />
        <Button onClick={lookup} disabled={looking || !query.trim()} variant="secondary">
          {looking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="ml-1">Look up</span>
        </Button>
      </div>

      {error && <p className="text-xs text-destructive px-1">{error}</p>}

      {result && (
        <ResultCard
          result={result}
          english={englishDraft}
          setEnglish={setEnglishDraft}
          subjects={subjects}
          subject={subject}
          setSubject={setSubject}
          onAdd={add}
          adding={adding}
        />
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Staged{staged.length > 0 ? ` (${staged.length})` : ""}
        </h2>
        {staged.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nothing staged yet. Look up a word above.
          </p>
        ) : (
          <ul className="space-y-2">
            {staged.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                subjects={subjects}
                onDelete={() => remove(entry.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function WordHeader({
  italian,
  english,
  isVerb,
  verbGroup,
  gender,
  subjectLabel,
  conjugation,
}: {
  italian: string;
  english?: string;
  isVerb: boolean;
  verbGroup: string | null;
  gender?: string | null;
  subjectLabel?: string | null;
  conjugation: Conjugation | null;
}) {
  const { speak } = useSpeech();
  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => speak(italian)}
          className="text-muted-foreground hover:text-foreground shrink-0"
          aria-label={`Pronounce ${italian}`}
        >
          <Volume2 className="h-4 w-4" />
        </button>
        <span className="text-lg font-semibold">{italian}</span>
        {english ? <span className="text-muted-foreground">— {english}</span> : null}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {isVerb && <Badge variant="secondary" className="text-[10px]">verb</Badge>}
        {conjugation?.reflexive && <Badge variant="secondary" className="text-[10px]">reflexive</Badge>}
        {verbGroup && <Badge variant="outline" className="text-[10px]">{verbGroup}</Badge>}
        {gender && (gender === "m" || gender === "f" || gender === "mf") && (
          <Badge variant="outline" className={cn("text-[10px]", GENDER_STYLE[gender])}>
            {GENDER_LABEL[gender]}
          </Badge>
        )}
        {conjugation && (
          <Badge
            variant="outline"
            title={conjugation.auxSource ? AUX_TITLE[conjugation.auxSource] : undefined}
            className={cn(
              "text-[10px]",
              conjugation.aux === "ESSERE" && "border-blue-500 text-blue-600 dark:text-blue-400",
              conjugation.aux === "BOTH" && "border-amber-500 text-amber-600 dark:text-amber-400",
            )}
          >
            aux: {AUX_LABEL[conjugation.aux]}
            {conjugation.auxSource === "curated" ? " ?" : ""}
          </Badge>
        )}
        {conjugation?.gerund && (
          <Badge variant="outline" className="text-[10px]">ger: {conjugation.gerund}</Badge>
        )}
        {subjectLabel && (
          <Badge variant="secondary" className="text-[10px]">{subjectLabel}</Badge>
        )}
      </div>
    </div>
  );
}

function ConjGrids({ conjugation }: { conjugation: Conjugation }) {
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

function ResultCard({
  result,
  english,
  setEnglish,
  subjects,
  subject,
  setSubject,
  onAdd,
  adding,
}: {
  result: LookupResult;
  english: string;
  setEnglish: (v: string) => void;
  subjects: Subject[];
  subject: string;
  setSubject: (v: string) => void;
  onAdd: () => void;
  adding: boolean;
}) {
  const dup = result.already.exists;
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <WordHeader
        italian={result.italian}
        isVerb={result.isVerb}
        verbGroup={result.verbGroup}
        gender={result.gender}
        conjugation={result.conjugation}
      />

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Meaning</label>
        <Input
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !dup) {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder="e.g. to break"
        />
        {result.englishSource === "wiktionary" && (
          <p className="text-[11px] text-muted-foreground">
            Auto-filled from Wiktionary — edit to the sense you learned.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Topic (Learn path)</label>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a topic…" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.emoji} {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {result.conjugation && <ConjGrids conjugation={result.conjugation} />}

      {dup ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          Already in {WHERE_LABEL[result.already.where ?? "staged"]}.
        </p>
      ) : (
        <Button onClick={onAdd} disabled={adding} className="w-full">
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span className="ml-1">Add to vocab</span>
        </Button>
      )}
    </div>
  );
}

function EntryCard({
  entry,
  subjects,
  onDelete,
}: {
  entry: StagedEntry;
  subjects: Subject[];
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasConj = !!entry.conjugation && Object.keys(entry.conjugation.tenses).length > 0;
  const subj = subjects.find((s) => entry.tags?.includes(s.id));

  return (
    <li className="rounded-lg border border-border bg-card">
      <div className="flex items-start gap-2 p-3">
        <div className="min-w-0 flex-1">
          <WordHeader
            italian={entry.italian}
            english={entry.english}
            isVerb={entry.partOfSpeech === "verb"}
            verbGroup={entry.verbGroup}
            gender={entry.gender}
            subjectLabel={subj ? `${subj.emoji} ${subj.label}` : null}
            conjugation={entry.conjugation}
          />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {hasConj && (
            <button
              onClick={() => setOpen((o) => !o)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Toggle conjugation"
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
            </button>
          )}
          <button
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive"
            aria-label={`Remove ${entry.italian}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {open && hasConj && entry.conjugation && (
        <div className="border-t border-border px-3 py-3">
          <ConjGrids conjugation={entry.conjugation} />
        </div>
      )}
    </li>
  );
}
