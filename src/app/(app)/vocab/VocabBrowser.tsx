"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VocabItem } from "@/lib/content";
import type { VerbClass } from "@/lib/conjugate";

type VocabWithClass = VocabItem & { verbClass?: VerbClass | null };

const POS_COLORS: Record<string, string> = {
  noun: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  verb: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  adjective: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  adverb: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const POS_OPTIONS = [
  { label: "All types", value: "all" },
  { label: "Nouns", value: "noun" },
  { label: "Verbs", value: "verb" },
  { label: "Adjectives", value: "adjective" },
  { label: "Adverbs", value: "adverb" },
];

const GROUP_OPTIONS = [
  { label: "All verbs", value: "all" },
  { label: "-are", value: "-are" },
  { label: "-ere", value: "-ere" },
  { label: "-ire", value: "-ire" },
  { label: "-isc", value: "-isc" },
  { label: "Irregular", value: "irregular" },
];

const PAGE_SIZE = 24;

export default function VocabBrowser({ initialItems }: { initialItems: VocabWithClass[] }) {
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState("all");
  const [group, setGroup] = useState("all");
  const [page, setPage] = useState(1);
  const [speaking, setSpeaking] = useState("");

  function speak(text: string) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (speaking === text) {
      setSpeaking("");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "it-IT";
    utterance.rate = 0.9;
    utterance.onstart = () => setSpeaking(text);
    utterance.onend = () => setSpeaking("");
    utterance.onerror = () => setSpeaking("");
    window.speechSynthesis.speak(utterance);
  }

  const q = query.toLowerCase();
  const searched = initialItems.filter(
    (v) => !q || v.italian.toLowerCase().includes(q) || v.english.toLowerCase().includes(q),
  );
  const verbsSearched = searched.filter((v) => v.partOfSpeech === "verb");
  const count = (value: string) =>
    value === "all" ? searched.length : searched.filter((v) => v.partOfSpeech === value).length;
  const groupCountOf = (value: string) =>
    value === "all" ? verbsSearched.length : verbsSearched.filter((v) => v.verbClass === value).length;

  const filtered = searched.filter(
    (v) =>
      (pos === "all" || v.partOfSpeech === pos) &&
      (pos !== "verb" || group === "all" || v.verbClass === group),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">Vocabulary</h1>

      <Input
        placeholder="Search Italian or English…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPage(1);
        }}
        className="text-base"
      />

      <div className="flex gap-2">
        <Select
          value={pos}
          onValueChange={(v) => {
            setPos(v);
            setGroup("all");
            setPage(1);
          }}
        >
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label} ({count(o.value)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {pos === "verb" && (
          <Select
            value={group}
            onValueChange={(v) => {
              setGroup(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GROUP_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} disabled={groupCountOf(o.value) === 0}>
                  {o.label} ({groupCountOf(o.value)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "word" : "words"}
      </p>

      <div className="space-y-2">
        {pageItems.map((item) => (
          <Link key={item.id} href={`/vocab/${item.id}`} className="block">
            <Card className="transition-colors hover:bg-accent">
              <CardContent className="pt-3 pb-3 px-4">
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
                  </div>
                  {item.pronunciation && (
                    <p className="text-xs text-muted-foreground italic tracking-wide">{item.pronunciation}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-0.5">{item.english}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No words found.</p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {current} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={current >= totalPages} onClick={() => setPage(current + 1)}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
