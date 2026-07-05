"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/lib/useSpeech";
import type { VocabItem } from "@/lib/content";
import { cn } from "@/lib/utils";
import { useQuizEngine, buildSessionPool, shuffle, DEFAULT_LIMIT } from "@/lib/useQuizEngine";
import CorrectBurst from "@/components/CorrectBurst";
import QuizHeader from "@/components/quiz/QuizHeader";
import LimitPicker from "@/components/quiz/LimitPicker";
import DoneScreen from "@/components/quiz/DoneScreen";

type Question = { item: VocabItem; options: string[] };

function buildQuestion(item: VocabItem, pool: VocabItem[]): Question {
  const distractors = shuffle(pool.filter((v) => v.english !== item.english))
    .slice(0, 3)
    .map((v) => v.english);
  return { item, options: shuffle([item.english, ...distractors]) };
}

export default function ListeningQuiz({ items }: { items: VocabItem[] }) {
  const [limit, setLimit] = useState<number | null>(DEFAULT_LIMIT);
  const [selected, setSelected] = useState<string | null>(null);
  const { speak, speaking } = useSpeech();

  const engine = useQuizEngine<Question>({
    mode: "listening",
    getId: (q) => q.item.id,
    // Reinforces the word's own mastery (session mode stays "listening").
    getRecordType: () => "vocab",
  });

  const pool = items.filter((v) => v.english && v.italian);

  function begin() {
    engine.begin(
      buildSessionPool(pool, { getId: (v) => v.id, limit }).map((item) =>
        buildQuestion(item, pool)
      )
    );
  }

  // Reset the selection when the engine advances (render-time adjustment).
  const questionKey = `${engine.started ? "s" : "-"}:${engine.index}`;
  const [prevQuestionKey, setPrevQuestionKey] = useState(questionKey);
  if (prevQuestionKey !== questionKey) {
    setPrevQuestionKey(questionKey);
    setSelected(null);
  }

  const q = engine.current;
  const submitted = engine.submitted;

  // Auto-play the Italian word each time the question changes.
  const spokenFor = useRef<string | null>(null);
  useEffect(() => {
    if (engine.started && !engine.done && q && spokenFor.current !== questionKey) {
      spokenFor.current = questionKey;
      speak(q.item.italian);
    }
  }, [engine.started, engine.done, q, questionKey, speak]);

  if (!engine.started) {
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
        <LimitPicker
          value={limit}
          onChange={setLimit}
          label="Words per session"
          allCount={pool.length}
        />
        <Button className="w-full h-12" onClick={begin}>
          Start · {limit === null ? pool.length : Math.min(limit, pool.length)} words
        </Button>
      </div>
    );
  }

  if (engine.done) {
    return (
      <DoneScreen
        score={engine.score}
        xp={engine.xp}
        wrongCount={engine.wrongIds.length}
        onRetry={begin}
        onBack={engine.backToSetup}
        backLabel="Back"
      />
    );
  }

  if (!q) return null;

  return (
    <div className="relative max-w-lg mx-auto px-4 py-6 space-y-6">
      {engine.burst > 0 && <CorrectBurst key={engine.burst} />}
      <QuizHeader
        title="Ascolto"
        index={engine.index}
        total={engine.deck.length}
        onExit={engine.exit}
      />

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
              onClick={() => {
                if (submitted) return;
                setSelected(opt);
                engine.submit(isCorrect, opt);
              }}
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

      {submitted && !engine.lastCorrect && (
        <Button className="w-full h-12" onClick={engine.next}>
          {engine.index + 1 >= engine.deck.length ? "See Results" : "Next →"}
        </Button>
      )}

      <div className="flex justify-between text-sm px-1">
        <span className="text-green-600 font-medium">✓ {engine.score.correct}</span>
        <span className="text-red-500 font-medium">✗ {engine.score.incorrect}</span>
      </div>
    </div>
  );
}
