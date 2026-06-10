"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useStudySession } from "@/lib/useStudySession";
import { useSpeech } from "@/lib/useSpeech";
import type { ImageDescription, ImageQuestion } from "@/lib/content";
import { cn } from "@/lib/utils";
import { getBoostEnabled } from "@/components/BoostToggle";
import CorrectBurst from "@/components/CorrectBurst";
import GlossedText from "@/components/GlossedText";
import { playCorrect, playWrong } from "@/lib/feedback";

const CONTENT_TYPE = "descrizione";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A question with its options pre-shuffled so the correct answer isn't always in the same spot. */
type DeckItem = ImageQuestion & { shuffledOptions: string[] };

export default function ImageDescriptionQuiz({
  images,
  weakIds = [],
}: {
  images: ImageDescription[];
  weakIds?: string[];
}) {
  const [active, setActive] = useState<ImageDescription | null>(null);
  const [deck, setDeck] = useState<DeckItem[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [burst, setBurst] = useState(0);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const { startSession, endSession, recordAttempt } = useStudySession(CONTENT_TYPE);
  const { speak, speaking } = useSpeech();
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearAdvance() {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  }

  useEffect(() => {
    return () => { endSession(); clearAdvance(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function beginDrill(img: ImageDescription, filterIds?: string[]) {
    const weakSet = new Set(weakIds);
    const boostEnabled = getBoostEnabled();
    const source = filterIds
      ? img.questions.filter((q) => filterIds.includes(q.id))
      : img.questions;
    const weighted: ImageQuestion[] = [];
    for (const q of source) {
      const copies = !filterIds && boostEnabled && weakSet.has(q.id) ? 2 : 1;
      for (let i = 0; i < copies; i++) weighted.push(q);
    }
    const pool: DeckItem[] = shuffle(weighted).map((q) => ({
      ...q,
      shuffledOptions: shuffle(q.options),
    }));
    clearAdvance();
    setActive(img);
    setDeck(pool);
    setIndex(0);
    setSelected(null);
    setSubmitted(false);
    setShowInfo(false);
    setBurst(0);
    setScore({ correct: 0, incorrect: 0 });
    setWrongIds([]);
    setDone(false);
    startSession();
  }

  function exitSession() {
    clearAdvance();
    endSession();
    setActive(null);
    setDone(false);
  }

  const q = deck[index];

  async function handleSubmit() {
    if (submitted || !selected || !q) return;
    setSubmitted(true);
    const correct = selected === q.correct;
    if (correct) {
      setBurst((b) => b + 1);
      playCorrect();
      clearAdvance();
      advanceTimer.current = setTimeout(() => handleNext(), 1100);
    } else {
      playWrong();
    }
    await recordAttempt(q.id, CONTENT_TYPE, correct, selected);
    if (!correct) setWrongIds((ids) => [...ids, q.id]);
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      incorrect: s.incorrect + (correct ? 0 : 1),
    }));
  }

  async function handleNext() {
    clearAdvance();
    const next = index + 1;
    if (next >= deck.length) {
      await endSession();
      setDone(true);
    } else {
      setIndex(next);
      setSelected(null);
      setSubmitted(false);
      setShowInfo(false);
    }
  }

  // ── Setup: pick a picture ──
  if (!active) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Descrivi l&apos;immagine</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Look at the picture and answer the questions about what&apos;s in it and where.
          </p>
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">How it works</p>
          <p className="text-sm text-muted-foreground">
            Choose a picture, then answer multiple-choice questions using <strong>c&apos;è / ci sono</strong>,
            colours, and position words (<em>a sinistra, al centro, dietro a…</em>). Tap 💡 for the guide.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {images.map((img) => (
            <button
              key={img.id}
              onClick={() => beginDrill(img)}
              className="group text-left rounded-2xl border-2 border-border bg-card overflow-hidden transition-colors hover:border-primary"
            >
              <div className="relative w-full h-40 bg-muted">
                <Image
                  src={img.image}
                  alt={img.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 512px"
                />
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{img.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {img.questions.length} question{img.questions.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <span className="text-primary text-sm font-medium opacity-70 group-hover:opacity-100">Start →</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Done ──
  if (done) {
    const pct = deck.length > 0 ? Math.round((score.correct / deck.length) * 100) : 0;
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6">
        <div className="text-5xl">{pct >= 70 ? "🎉" : "📚"}</div>
        <h1 className="text-2xl font-bold">Done!</h1>
        <p className="text-4xl font-bold">{pct}%</p>
        <p className="text-muted-foreground">{score.correct} / {deck.length} correct</p>
        <div className="flex w-full max-w-xs justify-around rounded-xl border-2 border-border bg-card py-3">
          <div className="text-center">
            <p className="text-xl font-bold text-yellow-500">+{score.correct * 10 + score.incorrect * 2}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">XP earned</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{pct}%</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">accuracy</p>
          </div>
        </div>
        <Button onClick={() => beginDrill(active)} className="w-full max-w-xs">Try Again</Button>
        {wrongIds.length > 0 && (
          <Button
            variant="outline"
            onClick={() => beginDrill(active, wrongIds)}
            className="w-full max-w-xs border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
          >
            Practice {wrongIds.length} missed
          </Button>
        )}
        <Button variant="outline" onClick={exitSession} className="w-full max-w-xs">
          Choose Another Picture
        </Button>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold">{active.title}</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{index + 1} / {deck.length}</span>
          <button
            onClick={exitSession}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
            aria-label="Exit session"
          >
            ✕
          </button>
        </div>
      </div>

      {/* The picture — full width */}
      <div className="relative w-full overflow-hidden rounded-xl bg-muted">
        <Image
          src={active.image}
          alt={active.title}
          width={active.width}
          height={active.height}
          className="w-full h-auto"
          sizes="(max-width: 640px) 100vw, 600px"
          priority
        />
      </div>

      {/* Question */}
      <div className="relative rounded-2xl border-2 border-border bg-card px-4 py-3">
        {burst > 0 && <CorrectBurst key={burst} />}
        <div className="flex items-start justify-between gap-3">
          <p className="text-base font-medium leading-snug"><GlossedText text={q.question} /></p>
          <div className="flex shrink-0 items-center gap-2">
            {q.english && (
              <button
                onClick={() => setShowInfo((v) => !v)}
                className={cn("text-lg transition-opacity", showInfo ? "opacity-100" : "opacity-60 hover:opacity-100")}
                aria-label="Show English translation"
                aria-pressed={showInfo}
              >
                ℹ️
              </button>
            )}
            <button
              onClick={() => speak(q.question)}
              className={cn("text-lg transition-opacity", speaking ? "opacity-40" : "opacity-60 hover:opacity-100")}
              aria-label="Hear the question"
            >
              🔊
            </button>
          </div>
        </div>
        {showInfo && q.english && (
          <p className="mt-2 text-sm italic text-muted-foreground">{q.english}</p>
        )}
      </div>

      {/* Options — stacked, full width (answers can be phrases) */}
      <div className="flex flex-col gap-2">
        {q.shuffledOptions.map((opt) => {
          let optClass = "border-border bg-background";
          if (submitted) {
            if (opt === q.correct) optClass = "border-green-500 bg-green-50 dark:bg-green-950";
            else if (opt === selected) optClass = "border-red-400 bg-red-50 dark:bg-red-950";
          } else if (selected === opt) {
            optClass = "border-primary";
          }
          return (
            <div
              key={opt}
              role="button"
              tabIndex={submitted ? -1 : 0}
              aria-disabled={submitted}
              onClick={() => { if (!submitted) setSelected(opt); }}
              onKeyDown={(e) => {
                if (!submitted && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  setSelected(opt);
                }
              }}
              className={cn(
                "w-full text-left border-2 rounded-xl px-4 py-2.5 text-base font-medium transition-colors select-none",
                !submitted && "cursor-pointer",
                optClass
              )}
            >
              <GlossedText text={opt} />
            </div>
          );
        })}
      </div>

      {submitted && (
        <div className="space-y-2">
          <p className={cn(
            "text-sm font-medium text-center",
            selected === q.correct ? "text-green-600" : "text-red-500"
          )}>
            {selected === q.correct ? "Correct! ✓" : `Incorrect — the answer is "${q.correct}"`}
          </p>
          {q.explanation && (
            <div className="rounded-xl bg-muted px-4 py-3">
              <p className="text-sm text-muted-foreground">{q.explanation}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        {!submitted ? (
          <Button className="flex-1 h-11" onClick={handleSubmit} disabled={!selected}>
            Check
          </Button>
        ) : selected === q.correct ? (
          <Button variant="ghost" className="flex-1 h-11 text-green-600 pointer-events-none">
            Correct! ✓
          </Button>
        ) : (
          <Button className="flex-1 h-11" onClick={handleNext}>
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
