"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useStudySession } from "@/lib/useStudySession";
import type { GrammarRule } from "@/lib/content";
import { cn } from "@/lib/utils";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

type Question = {
  rule: GrammarRule;
  questionText: string;
  options: string[];
  correct: string;
};

function buildQuestion(rule: GrammarRule, allRules: GrammarRule[]): Question {
  // Use a random example as the answer; quiz asks "which rule does this example illustrate?"
  const correctExample = rule.examples[Math.floor(Math.random() * rule.examples.length)];
  const distractorRules = allRules.filter((r) => r.id !== rule.id);
  const distractors = shuffle(distractorRules)
    .slice(0, 3)
    .map((r) => r.rule);
  const options = shuffle([rule.rule, ...distractors]);

  return {
    rule,
    questionText: correctExample,
    options,
    correct: rule.rule,
  };
}

export default function GrammarQuiz({ rules }: { rules: GrammarRule[] }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [done, setDone] = useState(false);
  const { startSession, endSession, recordAttempt } = useStudySession("grammar");

  const init = useCallback(() => {
    const shuffled = shuffle(rules);
    setQuestions(shuffled.map((rule) => buildQuestion(rule, rules)));
    setIndex(0);
    setSelected(null);
    setSubmitted(false);
    setScore({ correct: 0, incorrect: 0 });
    setDone(false);
    startSession();
  }, [rules, startSession]);

  useEffect(() => {
    init();
    return () => { endSession(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = questions[index];

  async function handleSubmit() {
    if (!selected || !q) return;
    const correct = selected === q.correct;
    await recordAttempt(q.rule.id, "grammar", correct, selected);
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

  if (questions.length === 0) {
    return <div className="flex items-center justify-center min-h-64">Loading…</div>;
  }

  if (done) {
    const pct = Math.round((score.correct / questions.length) * 100);
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6">
        <div className="text-5xl">{pct >= 70 ? "🎉" : "📚"}</div>
        <h1 className="text-2xl font-bold">Quiz Complete!</h1>
        <p className="text-4xl font-bold">{pct}%</p>
        <p className="text-muted-foreground">{score.correct} / {questions.length} correct</p>
        <Button onClick={init} className="w-full max-w-xs">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold">Grammar Quiz</h1>
        <span className="text-sm text-muted-foreground">{index + 1} / {questions.length}</span>
      </div>

      <Card>
        <CardContent className="pt-6 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Which grammar rule applies?
          </p>
          <p className="text-lg font-medium italic">{q.questionText}</p>
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
              htmlFor={`opt-${opt}`}
              className={cn(
                "flex items-center gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer transition-colors text-sm",
                optClass,
                !submitted && selected === opt && "border-primary"
              )}
            >
              <RadioGroupItem value={opt} id={`opt-${opt}`} />
              {opt}
            </Label>
          );
        })}
      </RadioGroup>

      {submitted && (
        <div className={cn(
          "rounded-xl px-4 py-3 text-sm",
          selected === q.correct
            ? "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
            : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
        )}>
          <p className="font-semibold mb-1">{q.rule.rule}</p>
          <p className="text-xs opacity-80">{q.rule.explanation}</p>
        </div>
      )}

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

      <div className="flex justify-between text-sm px-1">
        <span className="text-green-600 font-medium">✓ {score.correct}</span>
        <span className="text-red-500 font-medium">✗ {score.incorrect}</span>
      </div>
    </div>
  );
}
