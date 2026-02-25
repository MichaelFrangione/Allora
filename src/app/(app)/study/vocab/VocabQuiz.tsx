"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useStudySession } from "@/lib/useStudySession";
import { getVocabDistractors, getVocabUnit } from "@/lib/content";
import UnitSelector from "@/components/UnitSelector";
import type { VocabItem } from "@/lib/content";
import { cn } from "@/lib/utils";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

type Question = {
  item: VocabItem;
  options: string[];
  correct: string;
};

function buildQuestion(item: VocabItem, allItems: VocabItem[]): Question {
  const distractors = getVocabDistractors(item, 3);
  const options = shuffle([item.english, ...distractors.map((d) => d.english)]);
  return { item, options, correct: item.english };
}

export default function VocabQuiz({ items }: { items: VocabItem[] }) {
  const [unit, setUnit] = useState<number | undefined>(undefined);
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [done, setDone] = useState(false);
  const { startSession, endSession, recordAttempt } = useStudySession("vocab");

  const activeItems = unit ? items.filter((v) => getVocabUnit(v) === unit) : items;

  useEffect(() => {
    return () => { endSession(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function start() {
    const active = unit ? items.filter((v) => getVocabUnit(v) === unit) : items;
    const shuffled = shuffle(active);
    setQuestions(shuffled.map((item) => buildQuestion(item, items)));
    setIndex(0);
    setSelected(null);
    setSubmitted(false);
    setScore({ correct: 0, incorrect: 0 });
    setDone(false);
    setStarted(true);
    startSession();
  }

  const q = questions[index];

  async function handleSubmit() {
    if (!selected || !q) return;
    const correct = selected === q.correct;
    await recordAttempt(q.item.id, "vocab", correct, selected);
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      incorrect: s.incorrect + (correct ? 0 : 1),
    }));
    setSubmitted(true);
  }

  async function handleNext() {
    const next = index + 1;
    if (next >= questions.length) {
      await endSession();
      setDone(true);
    } else {
      setIndex(next);
      setSelected(null);
      setSubmitted(false);
    }
  }

  if (!started) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold">Vocab Quiz</h1>
        <UnitSelector value={unit} onChange={setUnit} />
        <Button
          className="w-full h-12"
          onClick={start}
          disabled={activeItems.length === 0}
        >
          Start · {activeItems.length} word{activeItems.length !== 1 ? "s" : ""}
        </Button>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score.correct / questions.length) * 100);
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6">
        <div className="text-5xl">{pct >= 70 ? "🎉" : "📚"}</div>
        <h1 className="text-2xl font-bold">Quiz Complete!</h1>
        <p className="text-4xl font-bold">{pct}%</p>
        <p className="text-muted-foreground">{score.correct} / {questions.length} correct</p>
        <Button onClick={start} className="w-full max-w-xs">Try Again</Button>
        <Button variant="outline" onClick={() => setStarted(false)} className="w-full max-w-xs">
          Change Unit
        </Button>
      </div>
    );
  }

  if (!q) {
    return <div className="flex items-center justify-center min-h-64">Loading…</div>;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold">Vocab Quiz</h1>
        <span className="text-sm text-muted-foreground">{index + 1} / {questions.length}</span>
      </div>

      <Card>
        <CardContent className="pt-8 pb-8 text-center">
          <p className="text-2xl font-bold">{q.item.italian}</p>
          {q.item.partOfSpeech && (
            <p className="text-sm text-muted-foreground mt-1">{q.item.partOfSpeech}</p>
          )}
        </CardContent>
      </Card>

      <RadioGroup
        value={selected ?? ""}
        onValueChange={(v) => { if (!submitted) setSelected(v); }}
        className="space-y-3"
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
              htmlFor={opt}
              className={cn(
                "flex items-center gap-3 border-2 rounded-xl px-4 py-4 cursor-pointer transition-colors text-base",
                optClass,
                !submitted && selected === opt && "border-primary"
              )}
            >
              <RadioGroupItem value={opt} id={opt} />
              {opt}
            </Label>
          );
        })}
      </RadioGroup>

      <div className="flex gap-3">
        {!submitted ? (
          <Button className="flex-1 h-12" onClick={handleSubmit} disabled={!selected}>
            Check
          </Button>
        ) : (
          <Button className="flex-1 h-12" onClick={handleNext}>
            {index + 1 >= questions.length ? "See Results" : "Next →"}
          </Button>
        )}
      </div>

      <div className="flex justify-between text-sm text-muted-foreground px-1">
        <span className="text-green-600 font-medium">✓ {score.correct}</span>
        <span className="text-red-500 font-medium">✗ {score.incorrect}</span>
      </div>
    </div>
  );
}
