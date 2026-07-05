"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SubjectSelector from "@/components/SubjectSelector";
import { tagsMatchSubject, subjectsPresent } from "@/lib/content";
import type { GrammarRule } from "@/lib/content";
import { cn } from "@/lib/utils";
import { useQuizEngine, buildSessionPool, shuffle, DEFAULT_LIMIT } from "@/lib/useQuizEngine";
import CorrectBurst from "@/components/CorrectBurst";
import QuizHeader from "@/components/quiz/QuizHeader";
import LimitPicker from "@/components/quiz/LimitPicker";
import DoneScreen from "@/components/quiz/DoneScreen";
import OptionList from "@/components/quiz/OptionList";

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
  const [subject, setSubject] = useState<string | undefined>(undefined);
  const availableSubjects = subjectsPresent(rules.map((r) => r.tags));
  const [limit, setLimit] = useState<number | null>(DEFAULT_LIMIT);
  const [selected, setSelected] = useState<string | null>(null);

  const engine = useQuizEngine<Question>({
    mode: "grammar",
    getId: (q) => q.rule.id,
  });

  const activeRules = subject ? rules.filter((r) => tagsMatchSubject(r.tags, subject)) : rules;

  function beginDrill(filterIds?: string[]) {
    let active = subject ? rules.filter((r) => tagsMatchSubject(r.tags, subject)) : rules;
    if (filterIds) {
      const filtered = active.filter((r) => filterIds.includes(r.id));
      if (filtered.length > 0) active = filtered;
      engine.begin(shuffle(active).map((rule) => buildQuestion(rule, rules)));
    } else {
      engine.begin(
        buildSessionPool(active, { getId: (r) => r.id, limit }).map((rule) =>
          buildQuestion(rule, rules)
        )
      );
    }
  }

  // Reset the selection when the engine advances (render-time adjustment).
  const questionKey = `${engine.started ? "s" : "-"}:${engine.index}`;
  const [prevQuestionKey, setPrevQuestionKey] = useState(questionKey);
  if (prevQuestionKey !== questionKey) {
    setPrevQuestionKey(questionKey);
    setSelected(null);
  }

  if (!engine.started) {
    const count = limit !== null ? Math.min(limit, activeRules.length) : activeRules.length;
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold">Grammar Quiz</h1>
        <SubjectSelector subjects={availableSubjects} value={subject} onChange={setSubject} />
        <LimitPicker value={limit} onChange={setLimit} />
        <Button
          className="w-full h-12"
          onClick={() => beginDrill()}
          disabled={activeRules.length === 0}
        >
          Start · {count} rule{count !== 1 ? "s" : ""}
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
        onRetry={() => beginDrill()}
        onPracticeMissed={() => beginDrill(engine.wrongIds)}
        onBack={engine.backToSetup}
        backLabel="Change Subject"
      />
    );
  }

  const q = engine.current;
  if (!q) {
    return <div className="flex items-center justify-center min-h-64">Loading…</div>;
  }
  const submitted = engine.submitted;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <QuizHeader
        title="Grammar Quiz"
        index={engine.index}
        total={engine.deck.length}
        onExit={engine.exit}
      />

      {/* Rule prompt */}
      <Card className="relative">
        {engine.burst > 0 && <CorrectBurst key={engine.burst} />}
        <CardContent className="pt-6 pb-6">
          <p className="text-xl font-bold mb-2">{q.rule.rule}</p>
          <p className="text-sm text-muted-foreground">{q.rule.explanation}</p>
        </CardContent>
      </Card>

      <p className="text-sm font-medium text-muted-foreground">
        Which sentence correctly uses this rule?
      </p>

      <OptionList
        options={q.options}
        selected={selected}
        submitted={submitted}
        correct={q.correct}
        onSelect={setSelected}
        className="space-y-3"
        optionClassName="text-sm px-4 py-3"
      />

      {submitted && (
        <div
          className={cn(
            "rounded-xl px-4 py-3 text-sm",
            engine.lastCorrect
              ? "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
              : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
          )}
        >
          {engine.lastCorrect ? "Correct!" : `Correct answer: ${q.correct}`}
        </div>
      )}

      <div className="flex gap-3">
        {!submitted ? (
          <Button
            className="flex-1 h-12"
            onClick={() => engine.submit(selected === q.correct, selected ?? undefined)}
            disabled={!selected}
          >
            Check
          </Button>
        ) : engine.lastCorrect ? (
          <Button variant="ghost" className="flex-1 h-12 text-green-600 pointer-events-none">
            Correct! ✓
          </Button>
        ) : (
          <Button className="flex-1 h-12" onClick={engine.next}>
            {engine.index + 1 >= engine.deck.length ? "See Results" : "Next →"}
          </Button>
        )}
      </div>

      <div className="flex justify-between text-sm px-1">
        <span className="text-green-600 font-medium">✓ {engine.score.correct}</span>
        <span className="text-red-500 font-medium">✗ {engine.score.incorrect}</span>
      </div>
    </div>
  );
}
