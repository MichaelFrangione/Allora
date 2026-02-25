"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useStudySession } from "@/lib/useStudySession";
import { getVocabUnit, getSentenceUnit, getVocabDistractors } from "@/lib/content";
import UnitSelector from "@/components/UnitSelector";
import type { VocabItem, SentenceExercise, Conjugation } from "@/lib/content";
import { cn } from "@/lib/utils";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PRONOUNS = ["io", "tu", "lui/lei", "noi", "voi", "loro"];

type MixedTask =
  | { type: "vocab-flip"; id: string; item: VocabItem; direction: "it→en" | "en→it" }
  | { type: "vocab-mcq"; id: string; item: VocabItem; options: string[]; correct: string }
  | { type: "sentence"; id: string; ex: SentenceExercise }
  | { type: "conj-form"; id: string; conj: Conjugation; pronoun: string; expected: string };

function buildTasks(
  vocabItems: VocabItem[],
  sentenceExercises: SentenceExercise[],
  conjList: Conjugation[]
): MixedTask[] {
  const tasks: MixedTask[] = [];

  // Pick up to 10 vocab items: 5 for flip, 5 for mcq
  const vocabPool = shuffle(vocabItems).slice(0, 10);
  const flipItems = vocabPool.slice(0, 5);
  const mcqItems = vocabPool.slice(5, 10);

  for (const item of flipItems) {
    const direction: "it→en" | "en→it" = Math.random() < 0.5 ? "it→en" : "en→it";
    tasks.push({ type: "vocab-flip", id: `flip-${item.id}-${direction}`, item, direction });
  }

  for (const item of mcqItems) {
    const distractors = getVocabDistractors(item, 3);
    const options = shuffle([item.english, ...distractors.map((d) => d.english)]);
    tasks.push({ type: "vocab-mcq", id: `mcq-${item.id}`, item, options, correct: item.english });
  }

  // 5 sentences
  const sentPool = shuffle(sentenceExercises).slice(0, 5);
  for (const ex of sentPool) {
    tasks.push({ type: "sentence", id: `sent-${ex.id}`, ex });
  }

  // 5 conjugation forms: random conj, random pronoun
  if (conjList.length > 0) {
    const conjPool = shuffle(conjList).slice(0, 5);
    for (const conj of conjPool) {
      const pronoun = PRONOUNS[Math.floor(Math.random() * PRONOUNS.length)];
      const expected = conj.forms[pronoun] ?? "";
      tasks.push({ type: "conj-form", id: `conj-${conj.id}-${pronoun}`, conj, pronoun, expected });
    }
  }

  return shuffle(tasks);
}

export default function MixedDrill({
  vocab,
  sentences,
  conjugations,
}: {
  vocab: VocabItem[];
  sentences: SentenceExercise[];
  conjugations: Conjugation[];
}) {
  const [unit, setUnit] = useState<number | undefined>(undefined);
  const [started, setStarted] = useState(false);
  const [tasks, setTasks] = useState<MixedTask[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [done, setDone] = useState(false);

  // Task sub-state (reset per task)
  const [flipped, setFlipped] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [builtWords, setBuiltWords] = useState<string[]>([]);
  const [wordPool, setWordPool] = useState<string[]>([]);
  const [sentChecked, setSentChecked] = useState(false);
  const [sentCorrect, setSentCorrect] = useState(false);
  const [conjAnswer, setConjAnswer] = useState("");
  const [conjChecked, setConjChecked] = useState(false);
  const [conjCorrect, setConjCorrect] = useState(false);

  const { startSession, endSession, recordAttempt } = useStudySession("mixed");

  const activeVocab = unit ? vocab.filter((v) => getVocabUnit(v) === unit) : vocab;
  const activeSentences = unit ? sentences.filter((s) => getSentenceUnit(s) === unit) : sentences;
  const totalAvailable = activeVocab.length + activeSentences.length + conjugations.length;

  useEffect(() => {
    return () => { endSession(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetTaskState = useCallback((task: MixedTask) => {
    setFlipped(false);
    setSelected(null);
    setSubmitted(false);
    setConjAnswer("");
    setConjChecked(false);
    setConjCorrect(false);
    setSentChecked(false);
    setSentCorrect(false);
    if (task.type === "sentence") {
      setBuiltWords([]);
      setWordPool(shuffle([...task.ex.parts, ...task.ex.distractors]));
    }
  }, []);

  function beginDrill() {
    const builtTasks = buildTasks(activeVocab, activeSentences, conjugations);
    setTasks(builtTasks);
    setIndex(0);
    setScore({ correct: 0, incorrect: 0 });
    setDone(false);
    setStarted(true);
    startSession();
    if (builtTasks.length > 0) resetTaskState(builtTasks[0]);
  }

  function exitSession() {
    endSession();
    setStarted(false);
    setDone(false);
  }

  async function advance(correct: boolean) {
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      incorrect: s.incorrect + (correct ? 0 : 1),
    }));
    const next = index + 1;
    if (next >= tasks.length) {
      await endSession();
      setDone(true);
    } else {
      setIndex(next);
      resetTaskState(tasks[next]);
    }
  }

  // ── Vocab flip handlers ───────────────────────────────────────
  async function handleFlipAnswer(task: Extract<MixedTask, { type: "vocab-flip" }>, correct: boolean) {
    await recordAttempt(task.item.id, "vocab", correct);
    await advance(correct);
  }

  // ── Vocab MCQ handlers ────────────────────────────────────────
  async function handleMcqSubmit(task: Extract<MixedTask, { type: "vocab-mcq" }>) {
    if (!selected) return;
    const correct = selected === task.correct;
    await recordAttempt(task.item.id, "vocab", correct, selected);
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      incorrect: s.incorrect + (correct ? 0 : 1),
    }));
    setSubmitted(true);
  }

  async function handleMcqNext() {
    const next = index + 1;
    if (next >= tasks.length) {
      await endSession();
      setDone(true);
    } else {
      setIndex(next);
      resetTaskState(tasks[next]);
    }
  }

  // ── Sentence handlers ─────────────────────────────────────────
  function addWord(word: string, wordIndex: number) {
    if (sentChecked) return;
    setBuiltWords((b) => [...b, word]);
    setWordPool((p) => p.filter((_, i) => i !== wordIndex));
  }

  function removeWord(word: string, builtIndex: number) {
    if (sentChecked) return;
    setBuiltWords((b) => b.filter((_, i) => i !== builtIndex));
    setWordPool((p) => [...p, word]);
  }

  async function handleSentCheck(task: Extract<MixedTask, { type: "sentence" }>) {
    const builtSentence = builtWords.join(" ");
    const isCorrect = builtSentence === task.ex.italian;
    setSentCorrect(isCorrect);
    setSentChecked(true);
    await recordAttempt(task.ex.id, "sentence", isCorrect, builtSentence);
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      incorrect: s.incorrect + (isCorrect ? 0 : 1),
    }));
  }

  async function handleSentNext() {
    const next = index + 1;
    if (next >= tasks.length) {
      await endSession();
      setDone(true);
    } else {
      setIndex(next);
      resetTaskState(tasks[next]);
    }
  }

  // ── Conj-form handlers ────────────────────────────────────────
  async function handleConjCheck(task: Extract<MixedTask, { type: "conj-form" }>) {
    const correct = conjAnswer.trim().toLowerCase() === task.expected.toLowerCase();
    setConjCorrect(correct);
    setConjChecked(true);
    await recordAttempt(task.conj.id, "conjugation", correct, conjAnswer);
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      incorrect: s.incorrect + (correct ? 0 : 1),
    }));
  }

  async function handleConjNext() {
    const next = index + 1;
    if (next >= tasks.length) {
      await endSession();
      setDone(true);
    } else {
      setIndex(next);
      resetTaskState(tasks[next]);
    }
  }

  // ── Setup screen ──────────────────────────────────────────────
  if (!started) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold">Mixed Drill</h1>
        <p className="text-sm text-muted-foreground">
          A mix of flip cards, vocab quiz, sentence building, and conjugation — all in one session.
        </p>
        <UnitSelector value={unit} onChange={setUnit} />
        <Button
          className="w-full h-12"
          onClick={beginDrill}
          disabled={totalAvailable === 0}
        >
          Start · ~20 tasks
        </Button>
      </div>
    );
  }

  // ── Done screen ───────────────────────────────────────────────
  if (done) {
    const total = tasks.length;
    const pct = total > 0 ? Math.round((score.correct / total) * 100) : 0;
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6">
        <div className="text-5xl">{pct >= 70 ? "🎉" : "📚"}</div>
        <h1 className="text-2xl font-bold">Mixed Complete!</h1>
        <p className="text-4xl font-bold">{pct}%</p>
        <p className="text-muted-foreground">{score.correct} / {total} correct</p>
        <Button onClick={beginDrill} className="w-full max-w-xs">Try Again</Button>
        <Button variant="outline" onClick={() => setStarted(false)} className="w-full max-w-xs">
          Change Unit
        </Button>
      </div>
    );
  }

  const task = tasks[index];
  if (!task) return <div className="flex items-center justify-center min-h-64">Loading…</div>;

  const header = (label: string) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h1 className="font-semibold">Mixed Drill</h1>
        <Badge variant="outline" className="text-xs">{label}</Badge>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{index + 1} / {tasks.length}</span>
        <button
          onClick={exitSession}
          className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
          aria-label="Exit session"
        >
          ✕
        </button>
      </div>
    </div>
  );

  const scoreBar = (
    <div className="flex justify-between text-sm px-1">
      <span className="text-green-600 font-medium">✓ {score.correct}</span>
      <span className="text-red-500 font-medium">✗ {score.incorrect}</span>
    </div>
  );

  // ── Render vocab-flip ─────────────────────────────────────────
  if (task.type === "vocab-flip") {
    const front = task.direction === "it→en" ? task.item.italian : task.item.english;
    const genderLabel = task.item.gender === "m" ? "masc." : task.item.gender === "f" ? "fem." : null;
    return (
      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
        {header(task.direction === "it→en" ? "Italian → English" : "English → Italian")}

        <div
          className="min-h-56 flex flex-col items-center justify-center rounded-2xl border-2 border-border bg-card p-8 cursor-pointer select-none active:scale-[0.98] transition-transform text-center gap-3"
          onClick={() => setFlipped((f) => !f)}
        >
          {!flipped ? (
            <>
              <p className="text-xl font-semibold">{front}</p>
              <p className="text-xs text-muted-foreground mt-2">Tap to reveal</p>
            </>
          ) : task.direction === "it→en" ? (
            <>
              <p className="text-xl font-semibold">{task.item.english}</p>
              {genderLabel && <p className="text-sm text-muted-foreground">({genderLabel})</p>}
              {task.item.example && (
                <p className="text-sm text-muted-foreground italic mt-1">{task.item.example}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-xl font-semibold">{task.item.italian}</p>
              {genderLabel && <p className="text-sm text-muted-foreground">({genderLabel})</p>}
            </>
          )}
        </div>

        <div className={cn("grid grid-cols-2 gap-3 transition-opacity", !flipped && "opacity-0 pointer-events-none")}>
          <Button
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 h-14 text-base"
            onClick={() => handleFlipAnswer(task, false)}
          >
            ✗ Missed it
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white h-14 text-base"
            onClick={() => handleFlipAnswer(task, true)}
          >
            ✓ Got it
          </Button>
        </div>
        {scoreBar}
      </div>
    );
  }

  // ── Render vocab-mcq ──────────────────────────────────────────
  if (task.type === "vocab-mcq") {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {header("Vocab MCQ")}
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-2xl font-bold">{task.item.italian}</p>
            {task.item.partOfSpeech && (
              <p className="text-sm text-muted-foreground mt-1">{task.item.partOfSpeech}</p>
            )}
          </CardContent>
        </Card>

        <RadioGroup
          value={selected ?? ""}
          onValueChange={(v) => { if (!submitted) setSelected(v); }}
          className="space-y-3"
        >
          {task.options.map((opt) => {
            let optClass = "border-border";
            if (submitted) {
              if (opt === task.correct) optClass = "border-green-500 bg-green-50 dark:bg-green-950";
              else if (opt === selected) optClass = "border-red-400 bg-red-50 dark:bg-red-950";
            }
            return (
              <Label
                key={opt}
                htmlFor={`mix-${opt}`}
                className={cn(
                  "flex items-center gap-3 border-2 rounded-xl px-4 py-4 cursor-pointer transition-colors text-base",
                  optClass,
                  !submitted && selected === opt && "border-primary"
                )}
              >
                <RadioGroupItem value={opt} id={`mix-${opt}`} />
                {opt}
              </Label>
            );
          })}
        </RadioGroup>

        <div className="flex gap-3">
          {!submitted ? (
            <Button className="flex-1 h-12" onClick={() => handleMcqSubmit(task)} disabled={!selected}>
              Check
            </Button>
          ) : (
            <Button className="flex-1 h-12" onClick={handleMcqNext}>
              {index + 1 >= tasks.length ? "See Results" : "Next →"}
            </Button>
          )}
        </div>
        {scoreBar}
      </div>
    );
  }

  // ── Render sentence ───────────────────────────────────────────
  if (task.type === "sentence") {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {header("Sentence")}
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Translate
            </p>
            <p className="text-base font-medium">{task.ex.english}</p>
          </CardContent>
        </Card>

        <div
          className={cn(
            "min-h-16 rounded-xl border-2 border-dashed p-3 flex flex-wrap gap-2 transition-colors",
            sentChecked && sentCorrect && "border-green-500 bg-green-50 dark:bg-green-950",
            sentChecked && !sentCorrect && "border-red-400 bg-red-50 dark:bg-red-950",
            !sentChecked && "border-border"
          )}
        >
          {builtWords.length === 0 && (
            <p className="text-sm text-muted-foreground self-center w-full text-center">
              Tap words below to build the sentence
            </p>
          )}
          {builtWords.map((word, i) => (
            <button
              key={`built-${i}`}
              onClick={() => removeWord(word, i)}
              className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium active:scale-95 transition-transform disabled:opacity-60"
              disabled={sentChecked}
            >
              {word}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {wordPool.map((word, i) => (
            <button
              key={`pool-${i}-${word}`}
              onClick={() => addWord(word, i)}
              className="px-4 py-2.5 rounded-lg border-2 border-border bg-background text-sm font-medium active:scale-95 transition-transform disabled:opacity-60"
              disabled={sentChecked}
            >
              {word}
            </button>
          ))}
        </div>

        {sentChecked && !sentCorrect && (
          <div className="rounded-xl bg-muted px-4 py-3 text-sm">
            <span className="text-muted-foreground">Correct: </span>
            <span className="font-semibold">{task.ex.italian}</span>
          </div>
        )}

        <div className="flex gap-3">
          {!sentChecked ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setBuiltWords([]);
                  setWordPool(shuffle([...task.ex.parts, ...task.ex.distractors]));
                }}
                className="flex-1"
              >
                Reset
              </Button>
              <Button
                className="flex-1 h-12"
                onClick={() => handleSentCheck(task)}
                disabled={builtWords.length === 0}
              >
                Check
              </Button>
            </>
          ) : (
            <Button className="flex-1 h-12" onClick={handleSentNext}>
              {index + 1 >= tasks.length ? "See Results" : "Next →"}
            </Button>
          )}
        </div>
        {scoreBar}
      </div>
    );
  }

  // ── Render conj-form ──────────────────────────────────────────
  if (task.type === "conj-form") {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {header("Conjugation")}

        <div className="rounded-2xl border-2 border-border bg-card p-8 text-center">
          <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-semibold">
            Conjugate · {task.conj.tense}
          </p>
          <p className="text-3xl font-bold">{task.pronoun}</p>
          <p className="text-muted-foreground mt-1">{task.conj.verb} — {task.conj.meaning}</p>
        </div>

        <div>
          <Input
            value={conjAnswer}
            onChange={(e) => { if (!conjChecked) setConjAnswer(e.target.value); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (!conjChecked) handleConjCheck(task);
                else handleConjNext();
              }
            }}
            placeholder="Type the conjugated form…"
            className={cn(
              "text-base h-12",
              conjChecked && conjCorrect && "border-green-500 bg-green-50 dark:bg-green-950",
              conjChecked && !conjCorrect && "border-red-400 bg-red-50 dark:bg-red-950"
            )}
            disabled={conjChecked}
            autoFocus
          />
          {conjChecked && !conjCorrect && (
            <p className="mt-2 text-sm">
              <span className="text-muted-foreground">Correct: </span>
              <span className="font-semibold text-green-700">{task.expected}</span>
            </p>
          )}
          {conjChecked && conjCorrect && (
            <p className="mt-2 text-sm text-green-600 font-medium">Correct! ✓</p>
          )}
        </div>

        <div className="flex gap-3">
          {!conjChecked ? (
            <Button className="flex-1 h-12" onClick={() => handleConjCheck(task)} disabled={!conjAnswer.trim()}>
              Check
            </Button>
          ) : (
            <Button className="flex-1 h-12" onClick={handleConjNext}>
              {index + 1 >= tasks.length ? "See Results" : "Next →"}
            </Button>
          )}
        </div>
        {scoreBar}
      </div>
    );
  }

  return null;
}
