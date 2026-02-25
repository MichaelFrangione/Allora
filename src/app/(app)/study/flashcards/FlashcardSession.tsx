"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStudySession } from "@/lib/useStudySession";
import type { Flashcard } from "@/lib/content";
import { cn } from "@/lib/utils";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function FlashcardSession({ cards }: { cards: Flashcard[] }) {
  const [deck, setDeck] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [done, setDone] = useState(false);
  const { startSession, endSession, recordAttempt } = useStudySession("flashcard");

  useEffect(() => {
    const shuffled = shuffle(cards);
    setDeck(shuffled);
    startSession();
    return () => { endSession(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = deck[index];

  async function handleAnswer(correct: boolean) {
    if (!current) return;
    await recordAttempt(current.id, "flashcard", correct);
    setScore((s) => ({
      ...s,
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

  function restart() {
    setDeck(shuffle(cards));
    setIndex(0);
    setFlipped(false);
    setScore({ correct: 0, incorrect: 0 });
    setDone(false);
    startSession();
  }

  if (!current && !done) {
    return <div className="flex items-center justify-center min-h-64">Loading…</div>;
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
        <Button onClick={restart} className="w-full max-w-xs">
          Shuffle & Repeat
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold">Flashcards</h1>
        <span className="text-sm text-muted-foreground">
          {index + 1} / {deck.length}
        </span>
      </div>

      {/* Card */}
      <div
        className="min-h-56 flex flex-col items-center justify-center rounded-2xl border-2 border-border bg-card p-8 cursor-pointer select-none active:scale-[0.98] transition-transform text-center gap-3"
        onClick={() => setFlipped((f) => !f)}
      >
        {!flipped ? (
          <>
            <p className="text-xl font-semibold">{current.front}</p>
            <p className="text-xs text-muted-foreground mt-2">Tap to reveal</p>
          </>
        ) : (
          <>
            <p className="text-xl font-semibold">{current.back}</p>
            <div className="flex flex-wrap gap-1 justify-center mt-2">
              {current.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
              ))}
            </div>
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
