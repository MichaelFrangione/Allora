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
import { getGrammarUnit } from "@/lib/content";
import type { GrammarRule, Conjugation } from "@/lib/content";

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

// ── Unit metadata ────────────────────────────────────────────────────────────

const UNIT_LABELS: Record<number, string> = {
  1: "Unit 1 — Verbs & Present Tense",
  2: "Unit 2 — Mi piace & Invitations",
  3: "Unit 3 — Irregular Verbs & Telling Time",
  4: "Unit 4 — Definite & Indefinite Articles",
  5: "Unit 5 — Adjectives & Nouns",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function GrammarCard({ rule }: { rule: GrammarRule }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{rule.rule}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <p className="text-sm text-muted-foreground">{rule.explanation}</p>
        {rule.examples.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Examples
            </p>
            <ul className="space-y-0.5">
              {rule.examples.map((ex, i) => (
                <li key={i} className="text-sm italic pl-3 border-l-2 border-muted">
                  {ex}
                </li>
              ))}
            </ul>
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

// ── Main component ────────────────────────────────────────────────────────────

export default function ReferenceBrowser({
  rules,
  conjugations,
}: {
  rules: GrammarRule[];
  conjugations: Conjugation[];
}) {
  const units = [1, 2, 3, 4, 5] as const;

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

        {/* Numbers */}
        <AccordionItem value="numbers" className="border rounded-lg px-4">
          <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">
            Numbers &amp; Counting
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <NumbersSection />
          </AccordionContent>
        </AccordionItem>

        {/* Time */}
        <AccordionItem value="time" className="border rounded-lg px-4">
          <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">
            Time, Days &amp; Months
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <TimeSection />
          </AccordionContent>
        </AccordionItem>

        {/* La Concordanza */}
        <AccordionItem value="concordanza" className="border rounded-lg px-4">
          <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">
            La Concordanza
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <ConcordanzaSection />
          </AccordionContent>
        </AccordionItem>

        {/* Units 1–5 */}
        {units.map((unit) => {
          const unitRules = rules.filter((r) => getGrammarUnit(r) === unit);
          const unitConjs = conjugations.filter((c) => {
            // Assign conjugations to units by convention
            if (unit === 1) return ["c001","c002","c003","c004","c005","c006","c007","c008","c009","c010","c011"].includes(c.id);
            if (unit === 3) return ["c012","c013"].includes(c.id);
            return false;
          });

          return (
            <AccordionItem key={unit} value={`unit-${unit}`} className="border rounded-lg px-4">
              <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">
                {UNIT_LABELS[unit]}
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-4">
                {unitRules.map((rule) => (
                  <GrammarCard key={rule.id} rule={rule} />
                ))}
                {unitConjs.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Conjugation Tables
                    </p>
                    {unitConjs.map((c) => (
                      <ConjugationTable key={c.id} conj={c} />
                    ))}
                  </div>
                )}
                {unitRules.length === 0 && unitConjs.length === 0 && (
                  <p className="text-sm text-muted-foreground">No content for this unit yet.</p>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}

      </Accordion>
    </div>
  );
}
