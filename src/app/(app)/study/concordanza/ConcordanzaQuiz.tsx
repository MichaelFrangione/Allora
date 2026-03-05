"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useStudySession } from "@/lib/useStudySession";
import type { ConcordanzaQuestion } from "@/lib/content";
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

export default function ConcordanzaQuiz({ questions }: { questions: ConcordanzaQuestion[] }) {
  const [limit, setLimit] = useState<number | null>(30);
  const [started, setStarted] = useState(false);
  const [deck, setDeck] = useState<ConcordanzaQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const { startSession, endSession, recordAttempt } = useStudySession("concordanza");

  useEffect(() => {
    return () => { endSession(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function beginDrill(filterIds?: string[]) {
    let pool = filterIds
      ? questions.filter((q) => filterIds.includes(q.id))
      : [...questions];
    pool = shuffle(pool);
    if (limit !== null && !filterIds) pool = pool.slice(0, limit);
    setDeck(pool);
    setIndex(0);
    setSelected(null);
    setSubmitted(false);
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

  const q = deck[index];

  async function handleSubmit() {
    if (!selected || !q) return;
    const correct = selected === q.correct;
    await recordAttempt(q.id, "concordanza", correct, selected);
    if (!correct) setWrongIds((ids) => [...ids, q.id]);
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      incorrect: s.incorrect + (correct ? 0 : 1),
    }));
    setSubmitted(true);
  }

  async function handleNext() {
    const next = index + 1;
    if (next >= deck.length) {
      await endSession();
      setDone(true);
    } else {
      setIndex(next);
      setSelected(null);
      setSubmitted(false);
    }
  }

  if (!started) {
    const count = limit !== null ? Math.min(limit, questions.length) : questions.length;
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">La Concordanza</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pick the correct adjective form to match the noun.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Questions per session</p>
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
          Start · {count} question{count !== 1 ? "s" : ""}
        </Button>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score.correct / deck.length) * 100);
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6">
        <div className="text-5xl">{pct >= 70 ? "🎉" : "📚"}</div>
        <h1 className="text-2xl font-bold">Done!</h1>
        <p className="text-4xl font-bold">{pct}%</p>
        <p className="text-muted-foreground">{score.correct} / {deck.length} correct</p>
        <Button onClick={() => beginDrill()} className="w-full max-w-xs">Try Again</Button>
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

  if (!q) return null;

  // Split sentence around blank
  const [before, after] = q.sentence.split("_____");

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold">La Concordanza</h1>
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

      {/* Question card */}
      <div className="rounded-2xl border-2 border-border bg-card px-6 py-8 space-y-3">
        <p className="text-lg font-medium leading-relaxed text-center">
          {before}
          <span className="inline-block border-b-2 border-primary min-w-20 mx-1 text-center font-bold text-primary">
            {submitted ? q.correct : "?"}
          </span>
          {after}
        </p>
        <p className="text-xs text-center text-muted-foreground">{q.hint}</p>
      </div>

      {/* Options */}
      <RadioGroup
        value={selected ?? ""}
        onValueChange={(v) => { if (!submitted) setSelected(v); }}
        className="grid grid-cols-2 gap-3"
      >
        {q.options.map((opt) => {
          let optClass = "border-border";
          if (submitted) {
            if (opt === q.correct) optClass = "border-green-500 bg-green-50 dark:bg-green-950";
            else if (opt === selected) optClass = "border-red-400 bg-red-50 dark:bg-red-950";
          }
          return (
            <Label
              key={opt}
              htmlFor={`opt-${opt}`}
              className={cn(
                "flex items-center gap-3 border-2 rounded-xl px-4 py-4 cursor-pointer transition-colors text-base",
                optClass,
                !submitted && selected === opt && "border-primary"
              )}
            >
              <RadioGroupItem value={opt} id={`opt-${opt}`} />
              <span className="font-medium">{opt}</span>
            </Label>
          );
        })}
      </RadioGroup>

      {submitted && (
        <p className={cn(
          "text-sm font-medium text-center",
          selected === q.correct ? "text-green-600" : "text-red-500"
        )}>
          {selected === q.correct
            ? "Correct! ✓"
            : `Incorrect — the answer is "${q.correct}"`}
        </p>
      )}

      <div className="flex gap-3">
        {!submitted ? (
          <Button className="flex-1 h-12" onClick={handleSubmit} disabled={!selected}>
            Check
          </Button>
        ) : (
          <Button className="flex-1 h-12" onClick={handleNext}>
            {index + 1 >= deck.length ? "See Results" : "Next →"}
          </Button>
        )}
      </div>

      <div className="flex justify-between text-sm px-1">
        <span className="text-green-600 font-medium">✓ {score.correct}</span>
        <span className="text-red-500 font-medium">✗ {score.incorrect}</span>
      </div>
    </div>
  );
}
