"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStudySession } from "@/lib/useStudySession";
import UnitSelector from "@/components/UnitSelector";
import { getSentenceUnit } from "@/lib/content";
import type { SentenceExercise } from "@/lib/content";
import { cn } from "@/lib/utils";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function SentenceBuilder({
  exercises,
}: {
  exercises: SentenceExercise[];
}) {
  const [unit, setUnit] = useState<number | undefined>(undefined);
  const [started, setStarted] = useState(false);
  const [deck, setDeck] = useState<SentenceExercise[]>([]);
  const [index, setIndex] = useState(0);
  const [built, setBuilt] = useState<string[]>([]);
  const [pool, setPool] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [done, setDone] = useState(false);
  const { startSession, endSession, recordAttempt } = useStudySession("sentence");

  const activeExercises = unit ? exercises.filter((e) => getSentenceUnit(e) === unit) : exercises;

  const loadExercise = useCallback((ex: SentenceExercise) => {
    setBuilt([]);
    setPool(shuffle([...ex.parts, ...ex.distractors]));
    setChecked(false);
    setCorrect(false);
  }, []);

  useEffect(() => {
    return () => { endSession(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function start() {
    const active = unit ? exercises.filter((e) => getSentenceUnit(e) === unit) : exercises;
    const shuffled = shuffle(active);
    setDeck(shuffled);
    setIndex(0);
    setScore({ correct: 0, incorrect: 0 });
    setDone(false);
    setStarted(true);
    startSession();
    loadExercise(shuffled[0]);
  }

  const ex = deck[index];

  function addWord(word: string, wordIndex: number) {
    if (checked) return;
    setBuilt((b) => [...b, word]);
    setPool((p) => p.filter((_, i) => i !== wordIndex));
  }

  function removeWord(word: string, builtIndex: number) {
    if (checked) return;
    setBuilt((b) => b.filter((_, i) => i !== builtIndex));
    setPool((p) => [...p, word]);
  }

  async function handleCheck() {
    if (!ex) return;
    const builtSentence = built.join(" ");
    const isCorrect = builtSentence === ex.italian;
    setCorrect(isCorrect);
    setChecked(true);
    await recordAttempt(ex.id, "sentence", isCorrect, builtSentence);
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      incorrect: s.incorrect + (isCorrect ? 0 : 1),
    }));
  }

  async function handleNext() {
    const next = index + 1;
    if (next >= deck.length) {
      await endSession();
      setDone(true);
    } else {
      setIndex(next);
      loadExercise(deck[next]);
    }
  }

  if (!started) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold">Sentence Builder</h1>
        <UnitSelector value={unit} onChange={setUnit} />
        <Button
          className="w-full h-12"
          onClick={start}
          disabled={activeExercises.length === 0}
        >
          Start · {activeExercises.length} sentence{activeExercises.length !== 1 ? "s" : ""}
        </Button>
      </div>
    );
  }

  if (!ex && !done) {
    return <div className="flex items-center justify-center min-h-64">Loading…</div>;
  }

  if (done) {
    const pct = Math.round((score.correct / deck.length) * 100);
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6">
        <div className="text-5xl">{pct >= 70 ? "🎉" : "📚"}</div>
        <h1 className="text-2xl font-bold">Complete!</h1>
        <p className="text-4xl font-bold">{pct}%</p>
        <p className="text-muted-foreground">{score.correct} / {deck.length} correct</p>
        <Button onClick={start} className="w-full max-w-xs">Shuffle & Repeat</Button>
        <Button variant="outline" onClick={() => setStarted(false)} className="w-full max-w-xs">
          Change Unit
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold">Sentence Builder</h1>
        <span className="text-sm text-muted-foreground">{index + 1} / {deck.length}</span>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Translate
          </p>
          <p className="text-base font-medium">{ex.english}</p>
        </CardContent>
      </Card>

      {/* Drop zone — built sentence */}
      <div
        className={cn(
          "min-h-16 rounded-xl border-2 border-dashed p-3 flex flex-wrap gap-2 transition-colors",
          checked && correct && "border-green-500 bg-green-50 dark:bg-green-950",
          checked && !correct && "border-red-400 bg-red-50 dark:bg-red-950",
          !checked && "border-border"
        )}
      >
        {built.length === 0 && (
          <p className="text-sm text-muted-foreground self-center w-full text-center">
            Tap words below to build the sentence
          </p>
        )}
        {built.map((word, i) => (
          <button
            key={`built-${i}`}
            onClick={() => removeWord(word, i)}
            className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium active:scale-95 transition-transform disabled:opacity-60"
            disabled={checked}
          >
            {word}
          </button>
        ))}
      </div>

      {/* Pool of available words */}
      <div className="flex flex-wrap gap-2">
        {pool.map((word, i) => (
          <button
            key={`pool-${i}-${word}`}
            onClick={() => addWord(word, i)}
            className="px-4 py-2.5 rounded-lg border-2 border-border bg-background text-sm font-medium active:scale-95 transition-transform disabled:opacity-60"
            disabled={checked}
          >
            {word}
          </button>
        ))}
      </div>

      {checked && !correct && (
        <div className="rounded-xl bg-muted px-4 py-3 text-sm">
          <span className="text-muted-foreground">Correct: </span>
          <span className="font-semibold">{ex.italian}</span>
        </div>
      )}

      <div className="flex gap-3">
        {!checked ? (
          <>
            <Button
              variant="outline"
              onClick={() => loadExercise(ex)}
              className="flex-1"
            >
              Reset
            </Button>
            <Button
              className="flex-1 h-12"
              onClick={handleCheck}
              disabled={built.length === 0}
            >
              Check
            </Button>
          </>
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
