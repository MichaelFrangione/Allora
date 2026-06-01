"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useStudySession } from "@/lib/useStudySession";
import { useSpeech } from "@/lib/useSpeech";
import type { VocabItem } from "@/lib/content";
import { cn } from "@/lib/utils";
import CorrectBurst from "@/components/CorrectBurst";
import { playCorrect, playWrong } from "@/lib/feedback";

const SESSION_SIZE = 15;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Question = { item: VocabItem; options: string[] };

function buildDeck(items: VocabItem[]): Question[] {
  const pool = items.filter((v) => v.english && v.italian);
  return shuffle(pool)
    .slice(0, SESSION_SIZE)
    .map((item) => {
      const distractors = shuffle(pool.filter((v) => v.english !== item.english))
        .slice(0, 3)
        .map((v) => v.english);
      return { item, options: shuffle([item.english, ...distractors]) };
    });
}

export default function ListeningQuiz({ items }: { items: VocabItem[] }) {
  const [started, setStarted] = useState(false);
  const [deck, setDeck] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [done, setDone] = useState(false);
  const [burst, setBurst] = useState(0);
  const { startSession, endSession, recordAttempt } = useStudySession("listening");
  const { speak, speaking } = useSpeech();

  const q = deck[index];
  const submitted = selected !== null;

  useEffect(() => () => { endSession(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-play the Italian word each time the question changes.
  const spokenFor = useRef<string | null>(null);
  useEffect(() => {
    if (started && q && spokenFor.current !== q.item.id) {
      spokenFor.current = q.item.id;
      speak(q.item.italian);
    }
  }, [started, q, speak]);

  function begin() {
    setDeck(buildDeck(items));
    setIndex(0);
    setSelected(null);
    setScore({ correct: 0, incorrect: 0 });
    setDone(false);
    setStarted(true);
    spokenFor.current = null;
    startSession();
  }

  async function choose(option: string) {
    if (submitted || !q) return;
    setSelected(option);
    const correct = option === q.item.english;
    if (correct) {
      setBurst((b) => b + 1);
      playCorrect();
    } else {
      playWrong();
    }
    // Record under "vocab" so it reinforces the word's mastery (mode stays "listening").
    await recordAttempt(q.item.id, "vocab", correct, option);
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      incorrect: s.incorrect + (correct ? 0 : 1),
    }));
  }

  async function next() {
    if (index + 1 >= deck.length) {
      await endSession();
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  }

  if (!started) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Ascolto 🎧</h1>
          <p className="text-sm text-muted-foreground mt-1">Listen and choose the meaning.</p>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">How it works</p>
          <p className="text-sm text-muted-foreground">
            You&apos;ll hear an Italian word — tap the 🔊 to replay it — then pick its English meaning.
          </p>
        </div>
        <Button className="w-full h-12" onClick={begin}>Start · {Math.min(SESSION_SIZE, items.length)} words</Button>
      </div>
    );
  }

  if (done) {
    const pct = deck.length > 0 ? Math.round((score.correct / deck.length) * 100) : 0;
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6">
        <div className="text-5xl">{pct >= 70 ? "🎉" : "📚"}</div>
        <h1 className="text-2xl font-bold">Done!</h1>
        <p className="text-4xl font-bold">{pct}%</p>
        <div className="flex w-full max-w-xs justify-around rounded-xl border-2 border-border bg-card py-3">
          <div className="text-center">
            <p className="text-xl font-bold text-yellow-500">+{score.correct * 10 + score.incorrect * 2}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">XP earned</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{score.correct} / {deck.length}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">correct</p>
          </div>
        </div>
        <Button onClick={begin} className="w-full max-w-xs">Again</Button>
        <Button variant="outline" onClick={() => setStarted(false)} className="w-full max-w-xs">Back</Button>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="relative max-w-lg mx-auto px-4 py-6 space-y-6">
      {burst > 0 && <CorrectBurst key={burst} />}
      <div className="flex items-center justify-between">
        <h1 className="font-semibold">Ascolto</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{index + 1} / {deck.length}</span>
          <button onClick={() => { endSession(); setStarted(false); }} aria-label="Exit" className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
        </div>
      </div>

      {/* Big speaker */}
      <div className="flex justify-center py-4">
        <button
          onClick={() => speak(q.item.italian)}
          aria-label="Play the word"
          className={cn(
            "flex h-28 w-28 items-center justify-center rounded-full border-4 border-primary bg-primary/10 text-5xl transition-transform active:scale-95",
            speaking && "animate-pulse"
          )}
        >
          🔊
        </button>
      </div>
      {submitted && (
        <p className="text-center text-sm text-muted-foreground italic">{q.item.italian}</p>
      )}

      <div className="grid grid-cols-1 gap-3">
        {q.options.map((opt) => {
          const isCorrect = opt === q.item.english;
          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              disabled={submitted}
              className={cn(
                "rounded-xl border-2 px-4 py-4 text-base font-medium text-left transition-colors",
                !submitted && "border-border hover:bg-accent",
                submitted && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950",
                submitted && !isCorrect && opt === selected && "border-red-400 bg-red-50 dark:bg-red-950",
                submitted && !isCorrect && opt !== selected && "border-border opacity-60"
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {submitted && (
        <Button className="w-full h-12" onClick={next}>
          {index + 1 >= deck.length ? "See Results" : "Next →"}
        </Button>
      )}

      <div className="flex justify-between text-sm px-1">
        <span className="text-green-600 font-medium">✓ {score.correct}</span>
        <span className="text-red-500 font-medium">✗ {score.incorrect}</span>
      </div>
    </div>
  );
}
