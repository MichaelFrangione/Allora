"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import SubjectSelector from "@/components/SubjectSelector";
import { tagsMatchSubject, subjectsPresent, SUBJECTS } from "@/lib/content";
import type { VocabItem } from "@/lib/content";
import type { VerbClass } from "@/lib/conjugate";

type VocabWithClass = VocabItem & { verbClass?: VerbClass | null };

const POS_COLORS: Record<string, string> = {
  noun: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  verb: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  adjective: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  adverb: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const POS_CHIPS = [
  { label: "All", value: "" },
  { label: "Nouns", value: "noun" },
  { label: "Verbs", value: "verb" },
  { label: "Adjectives", value: "adjective" },
  { label: "Adverbs", value: "adverb" },
];

const VERB_GROUPS = [
  { label: "All", value: "" },
  { label: "-are", value: "-are" },
  { label: "-ere", value: "-ere" },
  { label: "-ire", value: "-ire" },
  { label: "-isc", value: "-isc" },
  { label: "Irregular", value: "irregular" },
];

export default function VocabBrowser({
  initialItems,
}: {
  initialItems: VocabWithClass[];
}) {
  const [query, setQuery] = useState("");
  const [activePos, setActivePos] = useState("");
  const [activeGroup, setActiveGroup] = useState("");
  const [subject, setSubject] = useState<string | undefined>(undefined);
  const [speaking, setSpeaking] = useState("");

  function selectPos(value: string) {
    setActivePos(activePos === value ? "" : value);
    setActiveGroup("");
  }

  const availableSubjects = subjectsPresent(initialItems.map((v) => v.tags));

  function speak(text: string) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (speaking === text) { setSpeaking(""); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "it-IT";
    utterance.rate = 0.9;
    utterance.onstart = () => setSpeaking(text);
    utterance.onend = () => setSpeaking("");
    utterance.onerror = () => setSpeaking("");
    window.speechSynthesis.speak(utterance);
  }

  const q = query.toLowerCase();
  // Items matching search + subject only (before pos/group) — used for the filter counts.
  const base = initialItems.filter((v) => {
    const matchesSubject = !subject || tagsMatchSubject(v.tags, subject);
    const matchesQuery =
      !q || v.italian.toLowerCase().includes(q) || v.english.toLowerCase().includes(q);
    return matchesSubject && matchesQuery;
  });
  const verbsInBase = base.filter((v) => v.partOfSpeech === "verb");
  const posCount = (value: string) =>
    value === "" ? base.length : base.filter((v) => v.partOfSpeech === value).length;
  const groupCount = (value: string) =>
    value === "" ? verbsInBase.length : verbsInBase.filter((v) => v.verbClass === value).length;

  const filtered = base.filter((v) => {
    const matchesPos = !activePos || v.partOfSpeech === activePos;
    const matchesGroup = activePos !== "verb" || !activeGroup || v.verbClass === activeGroup;
    return matchesPos && matchesGroup;
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">Vocabulary</h1>

      <SubjectSelector subjects={availableSubjects} value={subject} onChange={setSubject} />

      <Input
        placeholder="Search Italian or English…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="text-base"
      />

      {/* Type filter */}
      <div className="flex flex-wrap gap-1.5">
        {POS_CHIPS.map(({ label, value }) => {
          const count = posCount(value);
          const active = activePos === value;
          return (
            <button
              key={value}
              onClick={() => selectPos(value)}
              disabled={count === 0 && !active}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors disabled:opacity-40 ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-accent"
              }`}
            >
              {label}
              <span className={`ml-1.5 text-xs ${active ? "opacity-80" : "text-muted-foreground"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Verb conjugation group — only when Verbs is selected */}
      {activePos === "verb" && (
        <div className="flex flex-wrap items-center gap-1.5 border-l-2 border-primary/40 pl-3 ml-0.5">
          {VERB_GROUPS.map(({ label, value }) => {
            const count = groupCount(value);
            const active = activeGroup === value;
            return (
              <button
                key={value || "all"}
                onClick={() => setActiveGroup(value)}
                disabled={count === 0 && value !== ""}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors disabled:opacity-40 ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                {label}
                <span className={`ml-1 ${active ? "opacity-80" : "text-muted-foreground"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-sm text-muted-foreground">{filtered.length} words</p>

      <div className="space-y-2">
        {filtered.map((item) => (
          <Link key={item.id} href={`/vocab/${item.id}`} className="block">
            <Card className="transition-colors hover:bg-accent">
            <CardContent className="pt-3 pb-3 px-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-base">{item.italian}</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        speak(item.italian);
                      }}
                      className={`text-base transition-opacity ${speaking === item.italian ? "opacity-40" : "opacity-50 hover:opacity-100"}`}
                      aria-label="Hear pronunciation"
                    >
                      🔊
                    </button>
                    {item.gender && (
                      <span className="text-xs text-muted-foreground">({item.gender}.)</span>
                    )}

                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        POS_COLORS[item.partOfSpeech] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.partOfSpeech}
                    </span>
                    {(() => {
                      const s = SUBJECTS.find((sub) => tagsMatchSubject(item.tags, sub.id));
                      return s ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-muted text-muted-foreground">
                          {s.emoji} {s.label}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  {item.pronunciation && (
                    <p className="text-xs text-muted-foreground italic tracking-wide">{item.pronunciation}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-0.5">{item.english}</p>
                  {item.example && (
                    <p className="text-xs text-muted-foreground italic mt-1">{item.example}</p>
                  )}
                </div>
              </div>
            </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No words found.</p>
      )}
    </div>
  );
}
