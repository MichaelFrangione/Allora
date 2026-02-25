"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useStudySession } from "@/lib/useStudySession";
import UnitSelector from "@/components/UnitSelector";
import { getGrammarUnit } from "@/lib/content";
import type { GrammarRule } from "@/lib/content";
import { cn } from "@/lib/utils";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Question = {
  rule: GrammarRule;
  options: string[];
  correct: string;
};

function buildQuestion(rule: GrammarRule, allRules: GrammarRule[]): Question {
  const correctExample = rule.examples[Math.floor(Math.random() * rule.examples.length)];
  const distractorRules = shuffle(allRules.filter((r) => r.id !== rule.id)).slice(0, 3);
  const distractors = distractorRules.map(
    (r) => r.examples[Math.floor(Math.random() * r.examples.length)]
  );
  const options = shuffle([correctExample, ...distractors]);
  return { rule, options, correct: correctExample };
}

export default function GrammarQuiz({ rules }: { rules: GrammarRule[] }) {
  const [unit, setUnit] = useState<number | undefined>(undefined);
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const { startSession, endSession, recordAttempt } = useStudySession("grammar");

  const activeRules = unit ? rules.filter((r) => getGrammarUnit(r) === unit) : rules;

  useEffect(() => {
    return () => { endSession(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function beginDrill(filterIds?: string[]) {
    let active = unit ? rules.filter((r) => getGrammarUnit(r) === unit) : rules;
    if (filterIds) {
      const filtered = active.filter((r) => filterIds.includes(r.id));
      if (filtered.length > 0) active = filtered;
    }
    const shuffled = shuffle(active);
    setQuestions(shuffled.map((rule) => buildQuestion(rule, rules)));
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

  const q = questions[index];

  async function handleSubmit() {
    if (!selected || !q) return;
    const correct = selected === q.correct;
    await recordAttempt(q.rule.id, "grammar", correct, selected);
    if (!correct) setWrongIds((ids) => [...ids, q.rule.id]);
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
        <h1 className="text-2xl font-bold">Grammar Quiz</h1>
        <UnitSelector value={unit} onChange={setUnit} />
        <Button
          className="w-full h-12"
          onClick={() => beginDrill()}
          disabled={activeRules.length === 0}
        >
          Start · {activeRules.length} rule{activeRules.length !== 1 ? "s" : ""}
        </Button>
      </div>
    );
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
          Change Unit
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold">Grammar Quiz</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{index + 1} / {questions.length}</span>
          <button
            onClick={exitSession}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
            aria-label="Exit session"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Rule prompt */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <p className="text-xl font-bold mb-2">{q.rule.rule}</p>
          <p className="text-sm text-muted-foreground">{q.rule.explanation}</p>
        </CardContent>
      </Card>

      <p className="text-sm font-medium text-muted-foreground">
        Which sentence correctly uses this rule?
      </p>

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
          {selected === q.correct
            ? "Correct!"
            : `Correct answer: ${q.correct}`}
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
