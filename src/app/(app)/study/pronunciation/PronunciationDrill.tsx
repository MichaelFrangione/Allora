"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStudySession } from "@/lib/useStudySession";
import type { PronunciationRule } from "@/lib/content";
import { cn } from "@/lib/utils";

const LIMIT_OPTIONS = [10, 20, 30, 50, null] as const;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PronunciationDrill({ rules }: { rules: PronunciationRule[] }) {
  const [limit, setLimit] = useState<number | null>(30);
  const [started, setStarted] = useState(false);
  const [deck, setDeck] = useState<PronunciationRule[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const { startSession, endSession, recordAttempt } = useStudySession("pronunciation");

  function beginDrill(filterIds?: string[]) {
    let pool = filterIds
      ? rules.filter((r) => filterIds.includes(r.id))
      : [...rules];
    pool = shuffle(pool);
    if (limit !== null && !filterIds) pool = pool.slice(0, limit);
    setDeck(pool);
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
    await recordAttempt(current.id, "pronunciation", correct);
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
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Pronunciation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Learn how Italian letter combinations really sound.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Cards per session</p>
          <div className="flex flex-wrap gap-2">
            {LIMIT_OPTIONS.map((l) => (
              <button
                key={l ?? "all"}
                onClick={() => setLimit(l)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  limit === l
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {l ?? "All"}
              </button>
            ))}
          </div>
        </div>
        <Button className="w-full h-12" onClick={() => beginDrill()}>
          Start · {limit !== null ? Math.min(limit, rules.length) : rules.length} rule{(limit ?? rules.length) !== 1 ? "s" : ""}
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
        <p className="text-4xl font-bold">{pct}%</p>
        <p className="text-muted-foreground">{score.correct} / {deck.length} correct</p>
        <Button onClick={() => beginDrill()} className="w-full max-w-xs">Shuffle & Repeat</Button>
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
          Back to Setup
        </Button>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold">Pronunciation</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{index + 1} / {deck.length}</span>
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
        Tap to see how it sounds
      </Badge>

      {/* Card */}
      <div
        className="min-h-64 flex flex-col items-center justify-center rounded-2xl border-2 border-border bg-card p-8 cursor-pointer select-none active:scale-[0.98] transition-transform text-center gap-4"
        onClick={() => setFlipped((f) => !f)}
      >
        {!flipped ? (
          <>
            <p className="text-4xl font-bold tracking-widest">{current.combo}</p>
            <p className="text-xs text-muted-foreground mt-1">Tap to reveal</p>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{current.phonetic}</p>
              <p className="text-base text-muted-foreground">{current.rule}</p>
            </div>
            <div className="w-full border-t border-border pt-4 mt-2 space-y-2 text-left">
              {current.examples.map((ex, i) => (
                <div key={i} className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm w-28 shrink-0">{ex.italian}</span>
                  <span className="text-xs text-primary font-mono">{ex.phonetic}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{ex.english}</span>
                </div>
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
          ✗ Still learning
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
