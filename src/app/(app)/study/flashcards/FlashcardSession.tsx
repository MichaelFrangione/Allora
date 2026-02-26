"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStudySession } from "@/lib/useStudySession";
import UnitSelector from "@/components/UnitSelector";
import { getVocabUnit } from "@/lib/content";
import type { VocabItem } from "@/lib/content";
import { cn } from "@/lib/utils";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type FlipCard = {
  id: string;
  item: VocabItem;
  direction: "it→en" | "en→it";
};

function buildDeck(items: VocabItem[]): FlipCard[] {
  const cards: FlipCard[] = [];
  for (const item of items) {
    cards.push({ id: `${item.id}-fwd`, item, direction: "it→en" });
    cards.push({ id: `${item.id}-rev`, item, direction: "en→it" });
  }
  return shuffle(cards);
}

export default function FlashcardSession({ vocab }: { vocab: VocabItem[] }) {
  const [unit, setUnit] = useState<number | undefined>(undefined);
  const [started, setStarted] = useState(false);
  const [deck, setDeck] = useState<FlipCard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const { startSession, endSession, recordAttempt } = useStudySession("flashcard");

  const activeItems = unit ? vocab.filter((v) => getVocabUnit(v) === unit) : vocab;

  useEffect(() => {
    return () => { endSession(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function beginDrill(filterIds?: string[]) {
    const active = unit ? vocab.filter((v) => getVocabUnit(v) === unit) : vocab;
    let cards = buildDeck(active);
    if (filterIds) {
      const filtered = cards.filter((c) => filterIds.includes(c.id));
      cards = filtered.length > 0 ? filtered : buildDeck(active);
    }
    setDeck(cards);
    setIndex(0);
    setFlipped(false);
    setScore({ correct: 0, incorrect: 0 });
    setWrongIds([]);
    setDone(false);
    setStarted(true);
    startSession();
  }

  function exitSession() {
    endSession();
    setStarted(false);
    setDone(false);
  }

  const current = deck[index];

  async function handleAnswer(correct: boolean) {
    if (!current) return;
    await recordAttempt(current.item.id, "flashcard", correct);
    if (!correct) setWrongIds((ids) => [...ids, current.id]);
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      incorrect: s.incorrect + (correct ? 0 : 1),
    }));
    const next = index + 1;
    if (next >= deck.length) {
      await endSession();
      setDone(true);
    } else {
      setIndex(next);
      setFlipped(false);
    }
  }

  if (!started) {
    const cardCount = activeItems.length * 2;
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold">Vocab Flip Cards</h1>
        <UnitSelector value={unit} onChange={setUnit} />
        <Button
          className="w-full h-12"
          onClick={() => beginDrill()}
          disabled={activeItems.length === 0}
        >
          Start · {cardCount} card{cardCount !== 1 ? "s" : ""}
        </Button>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score.correct / deck.length) * 100);
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6">
        <div className="text-5xl">{pct >= 70 ? "🎉" : "📚"}</div>
        <h1 className="text-2xl font-bold">Session Complete!</h1>
        <div className="text-center space-y-1">
          <p className="text-4xl font-bold">{pct}%</p>
          <p className="text-muted-foreground">
            {score.correct} correct · {score.incorrect} incorrect
          </p>
        </div>
        <Button onClick={() => beginDrill()} className="w-full max-w-xs">
          Shuffle & Repeat
        </Button>
        {wrongIds.length > 0 && (
          <Button
            variant="outline"
            onClick={() => beginDrill(wrongIds)}
            className="w-full max-w-xs border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
          >
            Practice {wrongIds.length} missed
          </Button>
        )}
        <Button variant="outline" onClick={() => setStarted(false)} className="w-full max-w-xs">
          Change Unit
        </Button>
      </div>
    );
  }

  if (!current) {
    return <div className="flex items-center justify-center min-h-64">Loading…</div>;
  }

  const front = current.direction === "it→en" ? current.item.italian : current.item.english;
  const genderLabel = current.item.gender === "m" ? "masc." : current.item.gender === "f" ? "fem." : null;
  const pronunciation = current.item.pronunciation;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold">Vocab Flip Cards</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {index + 1} / {deck.length}
          </span>
          <button
            onClick={exitSession}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
            aria-label="Exit session"
          >
            ✕
          </button>
        </div>
      </div>

      <Badge variant="outline" className="self-start text-xs">
        {current.direction === "it→en" ? "Italian → English" : "English → Italian"}
      </Badge>

      {/* Card */}
      <div
        className="min-h-56 flex flex-col items-center justify-center rounded-2xl border-2 border-border bg-card p-8 cursor-pointer select-none active:scale-[0.98] transition-transform text-center gap-3"
        onClick={() => setFlipped((f) => !f)}
      >
        {!flipped ? (
          <>
            <p className="text-xl font-semibold">{front}</p>
            {current.direction === "it→en" && pronunciation && (
              <p className="text-xs text-muted-foreground tracking-wide">{pronunciation}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Tap to reveal</p>
          </>
        ) : current.direction === "it→en" ? (
          <>
            <p className="text-xl font-semibold">{current.item.english}</p>
            {genderLabel && (
              <p className="text-sm text-muted-foreground">({genderLabel})</p>
            )}
            {current.item.example && (
              <p className="text-sm text-muted-foreground italic mt-1">{current.item.example}</p>
            )}
          </>
        ) : (
          <>
            <p className="text-xl font-semibold">{current.item.italian}</p>
            {pronunciation && (
              <p className="text-xs text-muted-foreground tracking-wide">{pronunciation}</p>
            )}
            {genderLabel && (
              <p className="text-sm text-muted-foreground">({genderLabel})</p>
            )}
          </>
        )}
      </div>

      <div className={cn("grid grid-cols-2 gap-3 transition-opacity", !flipped && "opacity-0 pointer-events-none")}>
        <Button
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 h-14 text-base"
          onClick={() => handleAnswer(false)}
        >
          ✗ Missed it
        </Button>
        <Button
          className="bg-green-600 hover:bg-green-700 text-white h-14 text-base"
          onClick={() => handleAnswer(true)}
        >
          ✓ Got it
        </Button>
      </div>

      <div className="flex justify-between text-sm text-muted-foreground px-1">
        <span className="text-green-600 font-medium">✓ {score.correct}</span>
        <span className="text-red-500 font-medium">✗ {score.incorrect}</span>
      </div>
    </div>
  );
}
