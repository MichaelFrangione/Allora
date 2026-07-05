"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSpeech } from "@/lib/useSpeech";
import { getVocabDistractors, tagsMatchSubject, subjectsPresent } from "@/lib/content";
import SubjectSelector from "@/components/SubjectSelector";
import type { VocabItem } from "@/lib/content";
import { cn } from "@/lib/utils";
import { useQuizEngine, buildSessionPool, shuffle, DEFAULT_LIMIT } from "@/lib/useQuizEngine";
import CorrectBurst from "@/components/CorrectBurst";
import QuizHeader from "@/components/quiz/QuizHeader";
import LimitPicker from "@/components/quiz/LimitPicker";
import DoneScreen from "@/components/quiz/DoneScreen";
import OptionList from "@/components/quiz/OptionList";

type Question = {
  item: VocabItem;
  options: string[];
  correct: string;
};

function buildQuestion(item: VocabItem): Question {
  const distractors = getVocabDistractors(item, 3);
  const options = shuffle([item.english, ...distractors.map((d) => d.english)]);
  return { item, options, correct: item.english };
}

export default function VocabQuiz({
  items,
  weakIds = [],
  initialIds,
}: {
  items: VocabItem[];
  weakIds?: string[];
  initialIds?: string[];
}) {
  const [subject, setSubject] = useState<string | undefined>(undefined);
  const availableSubjects = subjectsPresent(items.map((v) => v.tags));
  const [limit, setLimit] = useState<number | null>(DEFAULT_LIMIT);
  const [selected, setSelected] = useState<string | null>(null);
  const { speak, speaking } = useSpeech();

  const engine = useQuizEngine<Question>({
    mode: "vocab",
    getId: (q) => q.item.id,
  });

  const activeItems = subject ? items.filter((v) => tagsMatchSubject(v.tags, subject)) : items;

  function beginDrill(filterIds?: string[]) {
    let active = subject ? items.filter((v) => tagsMatchSubject(v.tags, subject)) : items;
    if (filterIds) {
      const filtered = active.filter((v) => filterIds.includes(v.id));
      if (filtered.length > 0) active = filtered;
      engine.begin(shuffle(active).map(buildQuestion));
    } else {
      engine.begin(
        buildSessionPool(active, { getId: (v) => v.id, weakIds, limit }).map(buildQuestion)
      );
    }
  }

  useEffect(() => {
    if (initialIds && initialIds.length > 0) beginDrill(initialIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset the selection when the engine advances (render-time adjustment).
  const questionKey = `${engine.started ? "s" : "-"}:${engine.index}`;
  const [prevQuestionKey, setPrevQuestionKey] = useState(questionKey);
  if (prevQuestionKey !== questionKey) {
    setPrevQuestionKey(questionKey);
    setSelected(null);
  }

  if (!engine.started) {
    const count = limit !== null ? Math.min(limit, activeItems.length) : activeItems.length;
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold">Vocab Quiz</h1>
        <SubjectSelector subjects={availableSubjects} value={subject} onChange={setSubject} />
        <LimitPicker value={limit} onChange={setLimit} />
        <Button
          className="w-full h-12"
          onClick={() => beginDrill()}
          disabled={activeItems.length === 0}
        >
          Start · {count} word{count !== 1 ? "s" : ""}
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
        title="Vocab Quiz"
        index={engine.index}
        total={engine.deck.length}
        onExit={engine.exit}
      />

      <Card className="relative">
        {engine.burst > 0 && <CorrectBurst key={engine.burst} />}
        <CardContent className="pt-8 pb-8 text-center">
          <p className="text-2xl font-bold">{q.item.italian}</p>
          {q.item.partOfSpeech && (
            <p className="text-sm text-muted-foreground mt-1">{q.item.partOfSpeech}</p>
          )}
          <button
            onClick={() => speak(q.item.italian)}
            className={cn("text-lg mt-3 transition-opacity", speaking ? "opacity-40" : "opacity-60 hover:opacity-100")}
            aria-label="Hear pronunciation"
          >
            🔊
          </button>
        </CardContent>
      </Card>

      <OptionList
        options={q.options}
        selected={selected}
        submitted={submitted}
        correct={q.correct}
        onSelect={setSelected}
        className="space-y-3"
      />

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

      <div className="flex justify-between text-sm text-muted-foreground px-1">
        <span className="text-green-600 font-medium">✓ {engine.score.correct}</span>
        <span className="text-red-500 font-medium">✗ {engine.score.incorrect}</span>
      </div>
    </div>
  );
}
