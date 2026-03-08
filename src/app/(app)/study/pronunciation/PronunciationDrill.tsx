"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useStudySession } from "@/lib/useStudySession";
import UnitSelector from "@/components/UnitSelector";
import { getVocabUnit } from "@/lib/content";
import type { VocabItem, PronunciationRule } from "@/lib/content";
import { cn } from "@/lib/utils";
import { getBoostEnabled } from "@/components/BoostToggle";

const LIMIT_OPTIONS = [10, 20, 30, 50, null] as const;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type DrillMode = "vocab" | "rules";

export default function PronunciationDrill({
  items,
  weakIds = [],
  rules = [],
}: {
  items: VocabItem[];
  weakIds?: string[];
  rules?: PronunciationRule[];
}) {
  const [mode, setMode] = useState<DrillMode>("vocab");
  const [unit, setUnit] = useState<number | undefined>(undefined);
  const [limit, setLimit] = useState<number | null>(30);
  const [started, setStarted] = useState(false);
  const [deck, setDeck] = useState<(VocabItem | PronunciationRule)[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const { startSession, endSession, recordAttempt } = useStudySession("pronunciation");

  function speak(text: string) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "it-IT";
    utterance.rate = 0.9;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  const activeItems = unit ? items.filter((v) => getVocabUnit(v) === unit) : items;
  const setupCount = mode === "rules"
    ? rules.length
    : limit !== null ? Math.min(limit, activeItems.length) : activeItems.length;

  function beginDrill(filterIds?: string[]) {
    let pool: (VocabItem | PronunciationRule)[];
    if (mode === "rules") {
      pool = shuffle([...rules]);
    } else if (filterIds) {
      pool = shuffle(items.filter((v) => filterIds.includes(v.id)));
    } else {
      const active = unit ? items.filter((v) => getVocabUnit(v) === unit) : items;
      const weakSet = new Set(weakIds);
      const boostEnabled = getBoostEnabled();
      const weighted: VocabItem[] = [];
      for (const item of active) {
        const copies = boostEnabled && weakSet.has(item.id) ? 3 : 1;
        for (let i = 0; i < copies; i++) weighted.push(item);
      }
      pool = shuffle(weighted);
      if (limit !== null) pool = pool.slice(0, limit);
    }
    setDeck(pool);
    setIndex(0);
    setFlipped(false);
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

  const current = deck[index];
  const isRule = current && "combo" in current;

  async function handleAnswer(correct: boolean) {
    if (!current) return;
    await recordAttempt(current.id, "pronunciation", correct);
    if (!correct) setWrongIds((ids) => [...ids, current.id]);
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      incorrect: s.incorrect + (correct ? 0 : 1),
    }));
    const next = index + 1;
    if (next >= deck.length) {
      await endSession();
      setDone(true);
    } else {
      setIndex(next);
      setFlipped(false);
    }
  }

  if (!started) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Pronunciation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            See a word or sound rule — flip to hear how it sounds.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Mode</p>
          <div className="flex gap-2">
            <button
              onClick={() => setMode("vocab")}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                mode === "vocab"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Vocab Words
            </button>
            <button
              onClick={() => setMode("rules")}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                mode === "rules"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Sound Rules
            </button>
          </div>
        </div>

        {mode === "vocab" && (
          <>
            <UnitSelector value={unit} onChange={setUnit} />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Cards per session</p>
              <div className="flex flex-wrap gap-2">
                {LIMIT_OPTIONS.map((l) => (
                  <button
                    key={l ?? "all"}
                    onClick={() => setLimit(l)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                      limit === l
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {l ?? "All"}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {mode === "rules" && (
          <p className="text-sm text-muted-foreground">
            Drills all {rules.length} Italian sound rules — CHI/CHE, GLI, GN, SC, Z, and more.
          </p>
        )}

        <Button
          className="w-full h-12"
          onClick={() => beginDrill()}
          disabled={setupCount === 0}
        >
          Start · {setupCount} {mode === "rules" ? "rule" : "word"}{setupCount !== 1 ? "s" : ""}
        </Button>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score.correct / deck.length) * 100);
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6">
        <div className="text-5xl">{pct >= 70 ? "🎉" : "📚"}</div>
        <h1 className="text-2xl font-bold">Session Complete!</h1>
        <p className="text-4xl font-bold">{pct}%</p>
        <p className="text-muted-foreground">{score.correct} / {deck.length} correct</p>
        <Button onClick={() => beginDrill()} className="w-full max-w-xs">Shuffle & Repeat</Button>
        {wrongIds.length > 0 && mode === "vocab" && (
          <Button
            variant="outline"
            onClick={() => beginDrill(wrongIds)}
            className="w-full max-w-xs border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
          >
            Practice {wrongIds.length} missed
          </Button>
        )}
        <Button variant="outline" onClick={() => setStarted(false)} className="w-full max-w-xs">
          Back to Setup
        </Button>
      </div>
    );
  }

  if (!current) return null;

  const vocabItem = !isRule ? (current as VocabItem) : null;
  const ruleItem = isRule ? (current as PronunciationRule) : null;
  const genderLabel = vocabItem?.gender === "maschile" ? "m." : vocabItem?.gender === "femminile" ? "f." : null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold">Pronunciation</h1>
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

      {/* Card */}
      <div
        className="min-h-56 flex flex-col items-center justify-center rounded-2xl border-2 border-border bg-card p-8 cursor-pointer select-none active:scale-[0.98] transition-transform text-center gap-3"
        onClick={() => setFlipped((f) => !f)}
      >
        {!flipped ? (
          <>
            {vocabItem && (
              <>
                <p className="text-3xl font-bold">{vocabItem.italian}</p>
                {genderLabel && <p className="text-sm text-muted-foreground">({genderLabel})</p>}
                <button
                  onClick={(e) => { e.stopPropagation(); speak(vocabItem.italian); }}
                  className={cn("text-lg mt-1 transition-opacity", speaking ? "opacity-40" : "opacity-60 hover:opacity-100")}
                  aria-label="Hear pronunciation"
                >
                  🔊
                </button>
              </>
            )}
            {ruleItem && (
              <>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Sound Rule</p>
                <p className="text-4xl font-bold">{ruleItem.combo}</p>
              </>
            )}
            <p className="text-xs text-muted-foreground mt-2">Tap to reveal</p>
          </>
        ) : (
          <>
            {vocabItem && (
              <>
                <p className="text-3xl font-bold tracking-wide text-primary">{vocabItem.pronunciation}</p>
                <p className="text-lg text-muted-foreground">{vocabItem.english}</p>
                {vocabItem.example && (
                  <p className="text-sm text-muted-foreground italic mt-1 border-t border-border pt-3 w-full text-center">
                    {vocabItem.example}
                  </p>
                )}
              </>
            )}
            {ruleItem && (
              <>
                <p className="text-2xl font-bold text-primary">{ruleItem.phonetic}</p>
                <p className="text-sm text-muted-foreground">{ruleItem.rule}</p>
                <div className="border-t border-border pt-3 w-full mt-1 space-y-1">
                  {ruleItem.examples.map((ex, i) => (
                    <p key={i} className="text-sm">
                      <span className="font-semibold">{ex.italian}</span>
                      <span className="text-muted-foreground"> → </span>
                      <span className="text-primary font-medium">{ex.phonetic}</span>
                      <span className="text-muted-foreground"> · {ex.english}</span>
                    </p>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className={cn("grid grid-cols-2 gap-3 transition-opacity", !flipped && "opacity-0 pointer-events-none")}>
        <Button
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 h-14 text-base"
          onClick={() => handleAnswer(false)}
        >
          ✗ Still learning
        </Button>
        <Button
          className="bg-green-600 hover:bg-green-700 text-white h-14 text-base"
          onClick={() => handleAnswer(true)}
        >
          ✓ Got it
        </Button>
      </div>

      <div className="flex justify-between text-sm text-muted-foreground px-1">
        <span className="text-green-600 font-medium">✓ {score.correct}</span>
        <span className="text-red-500 font-medium">✗ {score.incorrect}</span>
      </div>
    </div>
  );
}
