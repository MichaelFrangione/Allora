"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/lib/useSpeech";
import type { DrillQuestion } from "@/lib/content";
import { cn } from "@/lib/utils";
import { useQuizEngine, buildSessionPool, shuffle, DEFAULT_LIMIT } from "@/lib/useQuizEngine";
import { isAnswerCorrect, isTypeable } from "@/lib/answer-check";
import SubjectReference, { SUBJECT_REFERENCE_DATA } from "@/components/SubjectReference";
import CorrectBurst from "@/components/CorrectBurst";
import GlossedText from "@/components/GlossedText";
import QuizHeader from "@/components/quiz/QuizHeader";
import LimitPicker from "@/components/quiz/LimitPicker";
import DoneScreen from "@/components/quiz/DoneScreen";
import OptionList from "@/components/quiz/OptionList";
import TypedAnswer from "@/components/quiz/TypedAnswer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Blank marker in drill sentences — some content uses ___ and some _____. */
const BLANK_RE = /_{3,}/;

export type DrillInputMode = "choice" | "typed";

interface DrillQuizProps {
  title: string;
  subtitle: string;
  contentType: string;
  questions: DrillQuestion[];
  weakIds?: string[];
  categoryLabels?: Record<string, string>;
  /** Subject id whose conjugation / rule table the hint button reveals. */
  subjectId?: string;
  /** Plain-English instructions describing what the learner should do. */
  instructions?: string;
  /** Answer mode preselected on the setup screen ("typed" once a subject is mastered). */
  defaultInputMode?: DrillInputMode;
}

export default function DrillQuiz({
  title,
  subtitle,
  contentType,
  questions,
  weakIds = [],
  categoryLabels,
  subjectId,
  instructions,
  defaultInputMode = "choice",
}: DrillQuizProps) {
  const hasReference = !!(subjectId && SUBJECT_REFERENCE_DATA[subjectId]);
  const hasCategories = categoryLabels && Object.keys(categoryLabels).length > 0;
  const anyTypeable = questions.some((q) => isTypeable(q.correct));

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [limit, setLimit] = useState<number | null>(DEFAULT_LIMIT);
  const [inputMode, setInputMode] = useState<DrillInputMode>(
    anyTypeable ? defaultInputMode : "choice"
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [typedValue, setTypedValue] = useState("");
  const [showHint, setShowHint] = useState(false);

  const engine = useQuizEngine<DrillQuestion>({
    mode: contentType,
    getId: (q) => q.id,
    getRecordType: (q) => q.sourceType ?? contentType,
  });

  // Reset per-question local state when the engine advances (render-time
  // adjustment, per react.dev "you might not need an effect").
  const questionKey = `${engine.started ? "s" : "-"}:${engine.index}`;
  const [prevQuestionKey, setPrevQuestionKey] = useState(questionKey);
  if (prevQuestionKey !== questionKey) {
    setPrevQuestionKey(questionKey);
    setSelected(null);
    setTypedValue("");
    setShowHint(false);
  }

  const { speak, speaking } = useSpeech();

  function getPool(): DrillQuestion[] {
    if (!hasCategories || selectedCategory === "all") return questions;
    return questions.filter((q) => q.category === selectedCategory);
  }

  function beginDrill(filterIds?: string[]) {
    if (filterIds) {
      engine.begin(shuffle(questions.filter((q) => filterIds.includes(q.id))));
    } else {
      engine.begin(buildSessionPool(getPool(), { getId: (q) => q.id, weakIds, limit }));
    }
  }

  const q = engine.current;

  // Setup screen
  if (!engine.started) {
    const pool = getPool();
    const count = limit !== null ? Math.min(limit, pool.length) : pool.length;
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>

        {instructions && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">How it works</p>
            <p className="text-sm text-muted-foreground">{instructions}</p>
          </div>
        )}

        {/* Category selector */}
        {hasCategories && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Category</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
                  selectedCategory === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                All questions
                <span className="ml-2 opacity-60 text-xs">({questions.length})</span>
              </button>
              {Object.entries(categoryLabels!).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
                    selectedCategory === key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {label}
                  <span className="ml-2 opacity-60 text-xs">
                    ({questions.filter((q) => q.category === key).length})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Answer mode */}
        {anyTypeable && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Answer mode</p>
            <div className="flex gap-2">
              {(
                [
                  ["choice", "Multiple choice"],
                  ["typed", "Typing"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setInputMode(mode)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                    inputMode === mode
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {inputMode === "typed" && (
              <p className="text-xs text-muted-foreground mt-2">
                Type the answers yourself — harder, and better for remembering.
              </p>
            )}
          </div>
        )}

        <LimitPicker value={limit} onChange={setLimit} />

        <Button className="w-full h-12" onClick={() => beginDrill()} disabled={count === 0}>
          {count === 0 ? "No questions available" : `Start · ${count} question${count !== 1 ? "s" : ""}`}
        </Button>
      </div>
    );
  }

  // Done screen
  if (engine.done) {
    return (
      <DoneScreen
        score={engine.score}
        xp={engine.xp}
        wrongCount={engine.wrongIds.length}
        onRetry={() => beginDrill()}
        onPracticeMissed={() => beginDrill(engine.wrongIds)}
        onBack={engine.backToSetup}
      />
    );
  }

  if (!q) return null;

  const typed = inputMode === "typed" && isTypeable(q.correct);
  const parts = q.sentence.split(BLANK_RE);
  const before = parts[0] ?? "";
  const after = parts[1] ?? "";
  const submitted = engine.submitted;
  const wasCorrect = engine.lastCorrect === true;

  function handleChoiceSubmit() {
    if (!selected) return;
    engine.submit(selected === q!.correct, selected);
  }

  function handleTypedSubmit() {
    engine.submit(isAnswerCorrect(typedValue, q!.correct), typedValue.trim());
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <QuizHeader
        title={title}
        index={engine.index}
        total={engine.deck.length}
        onExit={engine.exit}
        instructions={instructions}
      />

      {/* Prompt block */}
      {q.prompt && (
        <div className="rounded-xl bg-muted px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Situation</p>
          <p className="text-sm italic"><GlossedText text={q.prompt} /></p>
        </div>
      )}

      {/* Question card */}
      <div className="relative rounded-2xl border-2 border-border bg-card px-6 py-8 space-y-3">
        {engine.burst > 0 && <CorrectBurst key={engine.burst} />}
        {engine.currentIsRetry && (
          <span className="absolute top-3 left-3 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            ↻ Retry
          </span>
        )}
        {(q.hint || hasReference) && (
          <Dialog open={showHint} onOpenChange={setShowHint}>
            <DialogTrigger asChild>
              <button
                type="button"
                aria-label="Show hint"
                className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80"
              >
                💡 Hint
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Hint</DialogTitle>
              </DialogHeader>
              {q.hint && <p className="text-sm text-muted-foreground">💡 {q.hint}</p>}
              {hasReference && <SubjectReference subjectId={subjectId} />}
            </DialogContent>
          </Dialog>
        )}
        <p className="text-lg font-medium leading-relaxed text-center">
          <GlossedText text={before} />
          <span className="inline-block border-b-2 border-primary min-w-16 mx-1 text-center font-bold text-primary">
            {submitted ? q.correct : "?"}
          </span>
          <GlossedText text={after} />
        </p>
        {submitted && (
          <div className="flex justify-center">
            <button
              onClick={() => speak(q.sentence.replace(BLANK_RE, q.correct))}
              className={cn("text-lg transition-opacity", speaking ? "opacity-40" : "opacity-60 hover:opacity-100")}
              aria-label="Hear sentence"
            >
              🔊
            </button>
          </div>
        )}
      </div>

      {/* Answer input */}
      {typed ? (
        <TypedAnswer
          value={typedValue}
          onChange={setTypedValue}
          onSubmit={handleTypedSubmit}
          submitted={submitted}
          correct={wasCorrect}
        />
      ) : (
        <OptionList
          options={q.options}
          selected={selected}
          submitted={submitted}
          correct={q.correct}
          onSelect={setSelected}
        />
      )}

      {submitted && (
        <div className="space-y-2">
          {!wasCorrect && (
            <p className="text-sm font-medium text-center text-red-500">
              Incorrect — the answer is &quot;{q.correct}&quot;. You&apos;ll see this one again.
            </p>
          )}
          {q.explanation && (
            <div className="rounded-xl bg-muted px-4 py-3">
              <p className="text-sm text-muted-foreground">{q.explanation}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        {!submitted ? (
          !typed ? (
            <Button className="flex-1 h-12" onClick={handleChoiceSubmit} disabled={!selected}>
              Check
            </Button>
          ) : null // typed mode renders its own Check button inside the form
        ) : wasCorrect ? (
          // Correct → auto-advances after the celebration; no button needed.
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
