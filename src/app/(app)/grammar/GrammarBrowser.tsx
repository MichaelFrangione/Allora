"use client";

import Link from "next/link";
import { ChevronRight, TableIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { tagsMatchSubject } from "@/lib/content";
import type { GrammarRule, Conjugation } from "@/lib/content";
import GlossedText from "@/components/GlossedText";
import {
  PRONOUNS,
  TIME_MARKERS,
  USAGE_EXAMPLES,
  REGULAR_PARTICIPLE,
  AVERE_VERBS,
  ESSERE_VERBS,
  AVERE_EXAMPLES,
  ESSERE_GROUPS,
  ESSERE_EXAMPLES,
  IRREGULAR_GROUPS,
  conjugatePP,
  type PPVerb,
} from "@/lib/passato-prossimo";

// ── Numbers data ─────────────────────────────────────────────────────────────

const CARDINALS = [
  ["0", "zero"], ["1", "uno"], ["2", "due"], ["3", "tre"], ["4", "quattro"],
  ["5", "cinque"], ["6", "sei"], ["7", "sette"], ["8", "otto"], ["9", "nove"],
  ["10", "dieci"], ["11", "undici"], ["12", "dodici"], ["13", "tredici"],
  ["14", "quattordici"], ["15", "quindici"], ["16", "sedici"], ["17", "diciassette"],
  ["18", "diciotto"], ["19", "diciannove"], ["20", "venti"],
  ["30", "trenta"], ["40", "quaranta"], ["50", "cinquanta"],
  ["60", "sessanta"], ["70", "settanta"], ["80", "ottanta"],
  ["90", "novanta"], ["100", "cento"], ["1000", "mille"],
];

const ORDINALS = [
  ["1st", "primo/a"], ["2nd", "secondo/a"], ["3rd", "terzo/a"],
  ["4th", "quarto/a"], ["5th", "quinto/a"], ["6th", "sesto/a"],
  ["7th", "settimo/a"], ["8th", "ottavo/a"], ["9th", "nono/a"], ["10th", "decimo/a"],
];

// ── Time data ─────────────────────────────────────────────────────────────────

const TIME_PHRASES = [
  ["Che ore sono? / Che ora è?", "What time is it?"],
  ["Sono le tre.", "It's 3 o'clock."],
  ["È l'una.", "It's 1 o'clock."],
  ["È mezzogiorno.", "It's noon."],
  ["È mezzanotte.", "It's midnight."],
  ["Sono le dieci e mezza.", "It's 10:30."],
  ["Sono le nove e un quarto.", "It's 9:15."],
  ["Sono le cinque meno un quarto.", "It's 4:45."],
  ["A che ora…? — Alle otto.", "At what time…? — At 8."],
  ["di mattina / di pomeriggio / di sera", "in the morning / afternoon / evening"],
];

const DAYS = [
  "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica",
];

const MONTHS = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];

const SEASONS = [
  ["primavera", "spring"], ["estate", "summer"],
  ["autunno", "autumn"], ["inverno", "winter"],
];

// ── Subject sections ───────────────────────────────────────────────────────────
// The Guide is organised by subject. Each section pulls its grammar rules by
// subject tag, plus an optional curated set of conjugation tables and/or a
// special visual reference (numbers/time, concordanza, preposizioni articolate).

type ExtraSection = "numbers-time" | "concordanza" | "preposizioni" | "passato-prossimo";

const SECTIONS: {
  id: string;
  label: string;
  conjIds?: string[];
  extra?: ExtraSection;
}[] = [
  {
    id: "present-tense",
    label: "🔤 Present Tense — Regular & Irregular Verbs",
    conjIds: ["c001", "c002", "c003", "c004", "c005", "c006", "c007", "c008", "c009", "c010", "c011", "c012", "c013", "c098", "c099", "c103", "c104"],
  },
  { id: "reflexive-verbs", label: "🔁 Reflexive Verbs", conjIds: ["c105", "c106", "c107", "c108", "c109", "c110", "c111"] },
  { id: "passato-prossimo", label: "⏮️ Passato Prossimo — Avere & Essere", extra: "passato-prossimo" },
  { id: "modals", label: "🔧 Modal Verbs", conjIds: ["c100", "c101", "c102"] },
  { id: "piacere", label: "💚 Piacere" },
  { id: "pronouns", label: "👉 Pronouns" },
  { id: "interrogatives", label: "❓ Question Words" },
  { id: "demonstratives", label: "👆 This & That" },
  { id: "greetings", label: "👋 Greetings & Farewells" },
  { id: "articles", label: "📰 Articles" },
  { id: "gender", label: "⚥ Noun Gender" },
  { id: "plural", label: "➕ Plurals" },
  { id: "adjectives", label: "🎨 Adjectives & Agreement", extra: "concordanza" },
  { id: "possessives", label: "👪 Possessives" },
  { id: "prepositions", label: "🔗 Prepositions", extra: "preposizioni" },
  { id: "time", label: "🕐 Numbers, Time, Days & Months", extra: "numbers-time" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

// Regex: line starts with ALL-CAPS word(s), optional parenthetical, then colon
const ALL_CAPS_HEADER = /^([A-ZÀÈÌÒÙ][A-ZÀÈÌÒÙ\s\-]+(?:\s*\([^)]*\))?)\s*:\s*(.*)$/;

function renderExplanationLine(line: string, key: string | number) {
  if (!line.trim()) return null;

  // ⚠️ Note / warning
  if (line.startsWith("⚠️")) {
    return (
      <div key={key} className="rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-2 text-sm">
        {line}
      </div>
    );
  }

  // ALL-CAPS section header with optional trailing content
  const headerMatch = line.match(ALL_CAPS_HEADER);
  if (headerMatch) {
    const [, label, rest] = headerMatch;
    return (
      <div key={key} className="pt-1 first:pt-0">
        <span className="text-xs font-bold uppercase tracking-wide text-foreground">{label.trim()}</span>
        {rest && <span className="text-sm text-muted-foreground ml-2">{rest}</span>}
      </div>
    );
  }

  return <p key={key} className="text-sm text-muted-foreground">{line}</p>;
}

function ExplanationRenderer({ text }: { text: string }) {
  // Split into major sections by blank lines
  const sections = text.split(/\n\n+/);

  return (
    <div className="space-y-3">
      {sections.map((section, si) => {
        const lines = section.split("\n").map((l) => l.trim()).filter(Boolean);
        const bullets = lines.filter((l) => l.startsWith("•"));
        const rest = lines.filter((l) => !l.startsWith("•"));

        return (
          <div key={si} className="space-y-1">
            {rest.map((line, li) => renderExplanationLine(line, `${si}-${li}`))}
            {bullets.length > 0 && (
              <ul className="space-y-1 mt-1">
                {bullets.map((b, bi) => (
                  <li key={bi} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="shrink-0 text-foreground font-medium">•</span>
                    <span>{b.slice(1).trim()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ExampleItem({ text }: { text: string }) {
  const t = text.trim();

  // Arrow sub-item (e.g. "  → Il ragazzo è stanco.")
  if (/^→/.test(t)) {
    return (
      <div className="text-sm pl-4 border-l-2 border-muted italic text-muted-foreground">
        {t.replace(/^→\s*/, "")}
      </div>
    );
  }

  // ALL-CAPS label row: "MASCHILE: il mio / il tuo..."
  const upperLabel = t.match(/^([A-ZÀÈÌÒÙ][A-ZÀÈÌÒÙ\s\-/]+(?:\s*\([^)]*\))?)\s*:\s*(.+)$/);
  if (upperLabel) {
    return (
      <div className="text-sm flex flex-wrap gap-x-2">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground shrink-0">{upperLabel[1].trim()}:</span>
        <span className="italic">{upperLabel[2]}</span>
      </div>
    );
  }

  // "Italian (English translation)" pattern
  const parenMatch = t.match(/^(.+?)\s+\((.+)\)\.?$/);
  if (parenMatch && !parenMatch[1].includes("(")) {
    return (
      <div className="text-sm pl-3 border-l-2 border-primary/30">
        <span className="italic font-medium">{parenMatch[1]}</span>
        <span className="text-muted-foreground"> ({parenMatch[2]})</span>
      </div>
    );
  }

  // "Italian = English" or "Italian — English"
  const splitMatch = t.match(/^(.+?)\s+(=|—)\s+(.+)$/);
  if (splitMatch) {
    return (
      <div className="text-sm pl-3 border-l-2 border-primary/30 flex flex-wrap gap-x-2">
        <span className="italic font-medium">{splitMatch[1]}</span>
        <span className="text-muted-foreground">— {splitMatch[3]}</span>
      </div>
    );
  }

  // Default: plain italic with left border
  return (
    <div className="text-sm pl-3 border-l-2 border-muted italic text-muted-foreground">
      {t}
    </div>
  );
}

function GrammarCard({ rule }: { rule: GrammarRule }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{rule.rule}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <ExplanationRenderer text={rule.explanation} />
        {rule.examples.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Examples
            </p>
            <div className="space-y-1.5">
              {rule.examples.map((ex, i) => (
                <ExampleItem key={i} text={ex} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConjugationTable({ conj }: { conj: Conjugation }) {
  const pronouns = ["io", "tu", "lui/lei", "noi", "voi", "loro"];
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="bg-muted px-3 py-1.5">
        <p className="text-sm font-semibold">{conj.verb} <span className="font-normal text-muted-foreground">— {conj.meaning}</span></p>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {pronouns.map((p) => (
            conj.forms[p] !== undefined && (
              <tr key={p} className="border-t border-border first:border-0">
                <td className="px-3 py-1.5 text-muted-foreground w-24">{p}</td>
                <td className="px-3 py-1.5 font-medium">{conj.forms[p]}</td>
              </tr>
            )
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NumbersSection() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Cardinal Numbers</p>
        <div className="grid grid-cols-3 gap-1">
          {CARDINALS.map(([num, word]) => (
            <div key={num} className="flex gap-2 text-sm py-0.5">
              <span className="text-muted-foreground w-10 shrink-0">{num}</span>
              <span className="font-medium">{word}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Ordinal Numbers</p>
        <div className="grid grid-cols-2 gap-1">
          {ORDINALS.map(([ord, word]) => (
            <div key={ord} className="flex gap-2 text-sm py-0.5">
              <span className="text-muted-foreground w-10 shrink-0">{ord}</span>
              <span className="font-medium">{word}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimeSection() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Telling the Time</p>
        <div className="space-y-1.5">
          {TIME_PHRASES.map(([it, en]) => (
            <div key={it} className="text-sm">
              <span className="font-medium italic">{it}</span>
              <span className="text-muted-foreground"> — {en}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Days of the Week</p>
          <ul className="space-y-0.5">
            {DAYS.map((d) => (
              <li key={d} className="text-sm font-medium">{d}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Seasons</p>
          <ul className="space-y-0.5">
            {SEASONS.map(([it, en]) => (
              <li key={it} className="text-sm">
                <span className="font-medium">{it}</span>
                <span className="text-muted-foreground"> ({en})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Months</p>
        <div className="grid grid-cols-3 gap-1">
          {MONTHS.map((m) => (
            <span key={m} className="text-sm font-medium">{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── La Concordanza ────────────────────────────────────────────────────────────

const E_NOUNS_MASC: [string, string][] = [
  ["il fiore", "flower"], ["il mare", "sea"], ["il pane", "bread"],
  ["il nome", "name"], ["il ristorante", "restaurant"],
];

const E_NOUNS_FEM: [string, string][] = [
  ["la notte", "night"], ["la luce", "light"], ["la stazione", "station"],
  ["la lezione", "lesson"], ["la decisione", "decision"],
];

function ConcordanzaSection() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        <strong>La concordanza</strong> means the article, noun, and adjective must all agree
        in <strong>gender</strong> (maschile / femminile) and <strong>number</strong> (singolare / plurale).
      </p>

      {/* Articles */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Articles (Articoli)
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(["Maschile", "Femminile"] as const).map((gender) => (
            <div key={gender} className="rounded-lg border overflow-hidden">
              <div className="bg-muted px-3 py-1.5">
                <p className="text-xs font-semibold">{gender}</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t">
                    <th className="px-3 py-1 text-left text-xs text-muted-foreground font-normal">Sing.</th>
                    <th className="px-3 py-1 text-left text-xs text-muted-foreground font-normal">Plur.</th>
                  </tr>
                </thead>
                <tbody>
                  {gender === "Maschile" ? (
                    <>
                      <tr className="border-t"><td className="px-3 py-1 font-medium">il</td><td className="px-3 py-1 font-medium">i</td></tr>
                      <tr className="border-t"><td className="px-3 py-1 font-medium">lo</td><td className="px-3 py-1 font-medium">gli</td></tr>
                      <tr className="border-t"><td className="px-3 py-1 font-medium">l&apos;</td><td className="px-3 py-1 font-medium">gli</td></tr>
                    </>
                  ) : (
                    <>
                      <tr className="border-t"><td className="px-3 py-1 font-medium">la</td><td className="px-3 py-1 font-medium">le</td></tr>
                      <tr className="border-t"><td className="px-3 py-1 font-medium">l&apos;</td><td className="px-3 py-1 font-medium">le</td></tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>

      {/* -O adjectives */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Adjectives ending in -O <span className="normal-case font-normal">(4 forms: -o / -a / -i / -e)</span>
        </p>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="px-3 py-1.5 text-left text-xs font-semibold w-20"></th>
                <th className="px-3 py-1.5 text-left text-xs font-semibold">Singolare</th>
                <th className="px-3 py-1.5 text-left text-xs font-semibold">Plurale</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-3 py-1.5 text-muted-foreground text-xs">Masc.</td>
                <td className="px-3 py-1.5 italic">il ragazzo <strong>alto</strong></td>
                <td className="px-3 py-1.5 italic">i ragazzi <strong>alti</strong></td>
              </tr>
              <tr className="border-t">
                <td className="px-3 py-1.5 text-muted-foreground text-xs">Fem.</td>
                <td className="px-3 py-1.5 italic">la ragazza <strong>alta</strong></td>
                <td className="px-3 py-1.5 italic">le ragazze <strong>alte</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* -E adjectives */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Adjectives ending in -E <span className="normal-case font-normal">(2 forms: -e sing. / -i pl.)</span>
        </p>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="px-3 py-1.5 text-left text-xs font-semibold w-20"></th>
                <th className="px-3 py-1.5 text-left text-xs font-semibold">Singolare</th>
                <th className="px-3 py-1.5 text-left text-xs font-semibold">Plurale</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-3 py-1.5 text-muted-foreground text-xs">Masc.</td>
                <td className="px-3 py-1.5 italic">il ragazzo <strong>intelligente</strong></td>
                <td className="px-3 py-1.5 italic">i ragazzi <strong>intelligenti</strong></td>
              </tr>
              <tr className="border-t">
                <td className="px-3 py-1.5 text-muted-foreground text-xs">Fem.</td>
                <td className="px-3 py-1.5 italic">la ragazza <strong>intelligente</strong></td>
                <td className="px-3 py-1.5 italic">le ragazze <strong>intelligenti</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Other examples: difficile → difficili, grande → grandi, felice → felici
        </p>
      </div>

      {/* Nouns ending in -E */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Nouns ending in -E <span className="normal-case font-normal">(gender must be memorised — plural always -E → -I)</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Maschile</p>
            <ul className="space-y-0.5">
              {E_NOUNS_MASC.map(([it, en]) => (
                <li key={it} className="text-sm">
                  <span className="font-medium italic">{it}</span>{" "}
                  <span className="text-muted-foreground text-xs">({en})</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Femminile</p>
            <ul className="space-y-0.5">
              {E_NOUNS_FEM.map(([it, en]) => (
                <li key={it} className="text-sm">
                  <span className="font-medium italic">{it}</span>{" "}
                  <span className="text-muted-foreground text-xs">({en})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Passato Prossimo ──────────────────────────────────────────────────────────

function PPExample({ it, en }: { it: string; en: string }) {
  return (
    <div className="text-sm pl-3 border-l-2 border-primary/30">
      <span className="italic font-medium">
        <GlossedText text={it} />
      </span>
      <span className="text-muted-foreground"> — {en}</span>
    </div>
  );
}

function PPConjTable({ verb }: { verb: PPVerb }) {
  const forms = conjugatePP(verb);
  const headerTint =
    verb.aux === "avere" ? "bg-blue-50 dark:bg-blue-950/40" : "bg-amber-50 dark:bg-amber-950/40";
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className={`flex items-baseline justify-between border-b px-3 py-1.5 ${headerTint}`}>
        <p className="text-sm font-semibold">
          {verb.verb} <span className="font-normal text-muted-foreground">— {verb.meaning}</span>
        </p>
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{verb.aux}</span>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {PRONOUNS.map((p, i) => (
            <tr key={p} className="border-t border-border first:border-0">
              <td className="w-20 px-3 py-1 text-muted-foreground">{p}</td>
              <td className="px-3 py-1 font-medium">{forms[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PassatoProssimoSection() {
  return (
    <div className="space-y-6">
      {/* What it is + the formula */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          A compound tense (<em>tempo composto</em>) for finished past actions that happened at a
          specific moment. It is built from two pieces:
        </p>
        <div className="rounded-lg border bg-muted px-3 py-2 text-center text-sm">
          <span className="font-semibold">ausiliare</span>{" "}
          <span className="text-muted-foreground">(avere / essere, al presente)</span>
          <span className="mx-1.5 font-bold text-primary">+</span>
          <span className="font-semibold">participio passato</span>
        </div>
      </div>

      {/* When to use — glanceable time markers */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Quando si usa? — Time markers
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TIME_MARKERS.map((t) => (
            <span key={t} className="rounded-full border bg-card px-2.5 py-0.5 text-xs">
              <GlossedText text={t} />
            </span>
          ))}
        </div>
        <div className="space-y-1.5 pt-1">
          {USAGE_EXAMPLES.map(([it, en]) => (
            <PPExample key={it} it={it} en={en} />
          ))}
        </div>
      </div>

      {/* Regular participle */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Il participio passato — regolare
        </p>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="w-16 px-3 py-1.5 text-left text-xs font-semibold">Verbo</th>
                <th className="w-24 px-3 py-1.5 text-left text-xs font-semibold">Participio</th>
                <th className="px-3 py-1.5 text-left text-xs font-semibold">Esempi</th>
              </tr>
            </thead>
            <tbody>
              {REGULAR_PARTICIPLE.map((r) => (
                <tr key={r.ending} className="border-t align-top">
                  <td className="px-3 py-1.5 font-bold">{r.ending}</td>
                  <td className="px-3 py-1.5 font-medium text-primary">{r.becomes}</td>
                  <td className="px-3 py-1.5 italic text-muted-foreground">
                    {r.examples.map(([inf, part]) => `${inf} → ${part}`).join(",  ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Avere or Essere? */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Avere o Essere?
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="overflow-hidden rounded-lg border">
            <div className="border-b bg-blue-50 px-3 py-1.5 dark:bg-blue-950/40">
              <p className="text-sm font-semibold">AVERE</p>
              <p className="text-xs text-muted-foreground">answers <em>chi? / che cosa?</em> (transitive)</p>
            </div>
            <div className="space-y-1.5 p-3">
              {AVERE_EXAMPLES.map(([it, en]) => (
                <PPExample key={it} it={it} en={en} />
              ))}
              <p className="pt-1 text-xs text-muted-foreground">
                Participle stays <strong>-o</strong> — no agreement.
              </p>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border">
            <div className="border-b bg-amber-50 px-3 py-1.5 dark:bg-amber-950/40">
              <p className="text-sm font-semibold">ESSERE</p>
              <p className="text-xs text-muted-foreground">does <em>not</em> answer chi? / che cosa?</p>
            </div>
            <ul className="space-y-1 p-3">
              {ESSERE_GROUPS.map((g) => (
                <li key={g.label} className="text-xs">
                  <span className="font-semibold">{g.label}</span>
                  <span className="text-muted-foreground"> — {g.verbs.slice(0, 4).join(", ")}…</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="space-y-1.5 pt-1">
          {ESSERE_EXAMPLES.map(([it, en]) => (
            <PPExample key={it} it={it} en={en} />
          ))}
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:border-amber-800 dark:bg-amber-950/40">
          ⚠️ With <strong>essere</strong> the participle agrees with the subject: -o (m.), -a (f.),
          -i (m. pl.), -e (f. pl.) — e.g. <em>sono andato / andata / andati / andate</em>.
        </div>
      </div>

      {/* Full example conjugations — every verb gets its table */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Coniugazione completa
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[...AVERE_VERBS, ...ESSERE_VERBS].map((v) => (
            <PPConjTable key={v.verb} verb={v} />
          ))}
        </div>
      </div>

      {/* Irregular participles, grouped by ending */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Participi irregolari
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {IRREGULAR_GROUPS.map((g) => (
            <div key={g.ending} className="overflow-hidden rounded-lg border">
              <div className="bg-muted px-3 py-1">
                <span className="text-xs font-bold">{g.ending}</span>
              </div>
              <ul className="divide-y">
                {g.pairs.map(([inf, part]) => (
                  <li key={inf} className="flex items-baseline justify-between px-3 py-1 text-sm">
                    <span className="italic text-muted-foreground">{inf}</span>
                    <span className="font-medium">{part}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Preposizioni Articolate ───────────────────────────────────────────────────

const PREP_ROWS: [string, string, string, string, string, string, string, string][] = [
  // [prep, il, lo, l', la, i, gli, le]
  ["DI",  "del",  "dello",  "dell'",  "della",  "dei",  "degli",  "delle"],
  ["A",   "al",   "allo",   "all'",   "alla",   "ai",   "agli",   "alle"],
  ["DA",  "dal",  "dallo",  "dall'",  "dalla",  "dai",  "dagli",  "dalle"],
  ["IN",  "nel",  "nello",  "nell'",  "nella",  "nei",  "negli",  "nelle"],
  ["SU",  "sul",  "sullo",  "sull'",  "sulla",  "sui",  "sugli",  "sulle"],
];

function PreposizioniArticolateSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Five prepositions (<strong>di, a, da, in, su</strong>) combine with the definite article.
        Con, per, tra, fra never combine.
      </p>
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="px-2 py-1.5 text-left text-xs font-semibold w-10">Prep</th>
              {["il", "lo", "l'", "la", "i", "gli", "le"].map((art) => (
                <th key={art} className="px-2 py-1.5 text-center text-xs font-semibold text-muted-foreground">{art}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PREP_ROWS.map(([prep, ...forms]) => (
              <tr key={prep} className="border-t">
                <td className="px-2 py-1.5 font-bold text-xs text-muted-foreground">{prep}</td>
                {forms.map((f) => (
                  <td key={f} className="px-2 py-1.5 text-center font-medium">{f}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Examples</p>
        {[
          ["Vado al supermercato.", "I go to the supermarket. (a + il)"],
          ["Il libro dello studente.", "The student's book. (di + lo)"],
          ["Vengo dalla stazione.", "I'm coming from the station. (da + la)"],
          ["Il caffè è sul tavolo.", "The coffee is on the table. (su + il)"],
          ["Abito nel centro.", "I live in the centre. (in + il)"],
        ].map(([it, en]) => (
          <div key={it} className="text-sm">
            <span className="font-medium italic">{it}</span>
            <span className="text-muted-foreground"> — {en}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReferenceBrowser({
  rules,
  conjugations,
}: {
  rules: GrammarRule[];
  conjugations: Conjugation[];
}) {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-2">
      <h1 className="text-2xl font-bold mb-4">Guide</h1>

      <Link href="/grammar/conjugations">
        <div className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted/50 transition-colors mb-2">
          <div className="flex items-center gap-3">
            <TableIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">Verb Conjugations</p>
              <p className="text-xs text-muted-foreground">All conjugation tables — searchable</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </Link>

      <Accordion type="multiple" className="space-y-2">

        {/* Organised by subject */}
        {SECTIONS.map((section) => {
          // g018 is an older, partial duplicate of g026 (both possessivi) — skip it
          const sectionRules = rules.filter(
            (r) => tagsMatchSubject(r.tags, section.id) && r.id !== "g018"
          );
          const sectionConjs = section.conjIds
            ? conjugations.filter((c) => section.conjIds!.includes(c.id))
            : [];

          // Skip sections with nothing to show
          if (sectionRules.length === 0 && sectionConjs.length === 0 && !section.extra) {
            return null;
          }

          return (
            <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-4">
              <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">
                {section.label}
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-4">
                {sectionRules.map((rule) => (
                  <GrammarCard key={rule.id} rule={rule} />
                ))}

                {section.extra === "numbers-time" && (
                  <>
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Numbers — Reference</p>
                      <NumbersSection />
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time, Days &amp; Months — Reference</p>
                      <TimeSection />
                    </div>
                  </>
                )}

                {section.extra === "passato-prossimo" && <PassatoProssimoSection />}

                {section.extra === "concordanza" && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">La Concordanza — Reference Tables</p>
                    <ConcordanzaSection />
                  </div>
                )}

                {section.extra === "preposizioni" && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preposizioni Articolate — Reference Table</p>
                    <PreposizioniArticolateSection />
                  </div>
                )}

                {sectionConjs.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Conjugation Tables</p>
                    {sectionConjs.map((c) => (
                      <ConjugationTable key={c.id} conj={c} />
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}

      </Accordion>
    </div>
  );
}
