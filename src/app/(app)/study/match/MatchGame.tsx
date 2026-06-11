"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useStudySession } from "@/lib/useStudySession";
import type { VocabItem } from "@/lib/content";
import { cn } from "@/lib/utils";
import CorrectBurst from "@/components/CorrectBurst";
import { playCorrect, playWrong } from "@/lib/feedback";

const PAIRS_PER_ROUND = 6;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Card = { key: string; vocabId: string; side: "it" | "en"; text: string };

function buildCards(items: VocabItem[]): Card[] {
  const chosen = shuffle(items.filter((v) => v.english && v.italian)).slice(0, PAIRS_PER_ROUND);
  const cards: Card[] = [];
  for (const v of chosen) {
    cards.push({ key: `${v.id}-it`, vocabId: v.id, side: "it", text: v.italian });
    cards.push({ key: `${v.id}-en`, vocabId: v.id, side: "en", text: v.english });
  }
  return shuffle(cards);
}

export default function MatchGame({ items }: { items: VocabItem[] }) {
  const [started, setStarted] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<string | null>(null); // card key
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string[]>([]); // two keys flashing red
  const [moves, setMoves] = useState(0);
  const [burst, setBurst] = useState(0);
  const { startSession, endSession, recordAttempt } = useStudySession("match");

  useEffect(() => () => { endSession(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const done = started && cards.length > 0 && matched.size === cards.length;

  function begin() {
    setCards(buildCards(items));
    setSelected(null);
    setMatched(new Set());
    setWrong([]);
    setMoves(0);
    setStarted(true);
    startSession();
  }

  function tap(card: Card) {
    if (matched.has(card.key) || wrong.length > 0) return;
    if (selected === null) {
      setSelected(card.key);
      return;
    }
    if (selected === card.key) {
      setSelected(null);
      return;
    }
    const first = cards.find((c) => c.key === selected)!;
    setMoves((m) => m + 1);
    if (first.vocabId === card.vocabId && first.side !== card.side) {
      const nextMatched = new Set(matched);
      nextMatched.add(first.key);
      nextMatched.add(card.key);
      setMatched(nextMatched);
      setSelected(null);
      playCorrect();
      void recordAttempt(card.vocabId, "vocab", true);
      if (nextMatched.size === cards.length) {
        setBurst((b) => b + 1);
        void endSession();
      }
    } else {
      setWrong([first.key, card.key]);
      setSelected(null);
      playWrong();
      void recordAttempt(card.vocabId, "vocab", false);
      setTimeout(() => setWrong([]), 650);
    }
  }

  if (!started) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Abbina 🧩</h1>
          <p className="text-sm text-muted-foreground mt-1">Match the pairs.</p>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">How it works</p>
          <p className="text-sm text-muted-foreground">
            Tap an Italian word, then its English translation, to clear the pair. Match all {PAIRS_PER_ROUND} as fast as you can.
          </p>
        </div>
        <Button className="w-full h-12" onClick={begin}>Start</Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="relative max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6">
        {burst > 0 && <CorrectBurst key={burst} />}
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold">All matched!</h1>
        <p className="text-muted-foreground">{PAIRS_PER_ROUND} pairs in {moves} moves</p>
        <Button onClick={begin} className="w-full max-w-xs">New round</Button>
        <Button variant="outline" onClick={() => setStarted(false)} className="w-full max-w-xs">Back</Button>
      </div>
    );
  }

  return (
    <div className="relative max-w-lg mx-auto px-4 py-6 space-y-5">
      {burst > 0 && <CorrectBurst key={burst} />}
      <div className="flex items-center justify-between">
        <h1 className="font-semibold">Abbina</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{matched.size / 2} / {PAIRS_PER_ROUND}</span>
          <button onClick={() => { endSession(); setStarted(false); }} aria-label="Exit" className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => {
          const isMatched = matched.has(card.key);
          const isSelected = selected === card.key;
          const isWrong = wrong.includes(card.key);
          return (
            <button
              key={card.key}
              onClick={() => tap(card)}
              disabled={isMatched}
              className={cn(
                "min-h-16 rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all",
                isMatched && "border-transparent bg-transparent opacity-0 pointer-events-none",
                !isMatched && isWrong && "border-red-400 bg-red-50 dark:bg-red-950",
                !isMatched && isSelected && "border-primary bg-primary/10",
                !isMatched && !isSelected && !isWrong && "border-border bg-card hover:bg-accent",
                card.side === "it" && !isMatched && "italic"
              )}
            >
              {card.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
