"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import UnitSelector from "@/components/UnitSelector";
import { getVocabUnit } from "@/lib/content";
import type { VocabItem } from "@/lib/content";

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
];

export default function VocabBrowser({
  initialItems,
}: {
  initialItems: VocabItem[];
}) {
  const [query, setQuery] = useState("");
  const [activePos, setActivePos] = useState("");
  const [unit, setUnit] = useState<number | undefined>(undefined);

  const filtered = initialItems.filter((v) => {
    const matchesUnit = !unit || getVocabUnit(v) === unit;
    const matchesPos = !activePos || v.partOfSpeech === activePos;
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      v.italian.toLowerCase().includes(q) ||
      v.english.toLowerCase().includes(q);
    return matchesUnit && matchesPos && matchesQuery;
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">Vocabulary</h1>

      <UnitSelector value={unit} onChange={setUnit} />

      <Input
        placeholder="Search Italian or English…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="text-base"
      />

      <div className="flex flex-wrap gap-2">
        {POS_CHIPS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setActivePos(activePos === value ? "" : value)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              activePos === value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-accent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} words</p>

      <div className="space-y-2">
        {filtered.map((item) => (
          <Card key={item.id}>
            <CardContent className="pt-3 pb-3 px-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-base">{item.italian}</span>
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
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-muted text-muted-foreground">
                      U{getVocabUnit(item)}
                    </span>
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
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No words found.</p>
      )}
    </div>
  );
}
