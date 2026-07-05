"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStudySession } from "@/lib/useStudySession";
import { playCorrect, playWrong } from "@/lib/feedback";
import { getBoostEnabled } from "@/components/BoostToggle";

export const XP_PER_CORRECT = 10;
export const XP_PER_WRONG = 2;

/** Session-length choices shared by every quiz; null = the whole pool. */
export const LIMIT_OPTIONS = [10, 20, 50, null] as const;
export const DEFAULT_LIMIT = 10;

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Boost-weighted, shuffled, limited session pool — the deck-building step every
 * quiz used to copy. Weak items appear 3× when boost is on.
 */
export function buildSessionPool<Q>(
  base: Q[],
  opts: {
    getId: (q: Q) => string;
    weakIds?: string[];
    limit: number | null;
    /** Override for tests; defaults to the user's Boost preference. */
    boost?: boolean;
  }
): Q[] {
  const weakSet = new Set(opts.weakIds ?? []);
  const boost = opts.boost ?? getBoostEnabled();
  const weighted: Q[] = [];
  for (const q of base) {
    const copies = boost && weakSet.has(opts.getId(q)) ? 3 : 1;
    for (let i = 0; i < copies; i++) weighted.push(q);
  }
  const pool = shuffle(weighted);
  return opts.limit === null ? pool : pool.slice(0, opts.limit);
}

/** A deck slot; `retry` entries are requeued misses — recorded, but not scored. */
export type DeckEntry<Q> = { q: Q; retry: boolean };

export interface QuizEngineOptions<Q> {
  /** StudySession mode (and default contentType for attempts). */
  mode: string;
  getId: (q: Q) => string;
  /** contentType a question's attempts record under; defaults to `mode`. */
  getRecordType?: (q: Q) => string;
  /** ms to auto-advance after a correct answer; 0 disables. */
  autoAdvanceMs?: number;
  /** Re-append missed questions to the end of the deck until answered correctly. */
  requeueWrong?: boolean;
}

export interface QuizEngine<Q> {
  started: boolean;
  done: boolean;
  deck: DeckEntry<Q>[];
  index: number;
  /** Current question, or null before start / after finish. */
  current: Q | null;
  /** True when the current deck slot is a requeued miss. */
  currentIsRetry: boolean;
  submitted: boolean;
  /** Whether the submitted answer was correct (null before submit). */
  lastCorrect: boolean | null;
  /** First-attempt score — retries don't count. */
  score: { correct: number; incorrect: number };
  /** XP across every recorded attempt this session, retries included. */
  xp: number;
  /** Ids answered wrong on first attempt (for "Practice missed"). */
  wrongIds: string[];
  /** Increments on each correct answer; keys the celebration burst. */
  burst: number;
  begin: (pool: Q[]) => void;
  submit: (correct: boolean, answer?: string) => void;
  next: () => void;
  exit: () => void;
  /** Return to the setup screen after a finished session. */
  backToSetup: () => void;
}

/**
 * The shared quiz state machine: deck, submission, first-attempt scoring,
 * wrong-answer requeue, XP, sounds, celebration burst, auto-advance, and
 * StudySession/attempt recording. Components keep only their question
 * renderer and any per-question local state (reset it on `engine.index`).
 */
export function useQuizEngine<Q>(options: QuizEngineOptions<Q>): QuizEngine<Q> {
  const { mode, getId, getRecordType, autoAdvanceMs = 1100, requeueWrong = true } = options;
  const { startSession, endSession, recordAttempt } = useStudySession(mode);

  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [deck, setDeck] = useState<DeckEntry<Q>[]>([]);
  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [xp, setXp] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [burst, setBurst] = useState(0);

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Timer callbacks must see the latest deck/index, not their render's closure.
  const live = useRef({ index: 0, deckLength: 0 });
  live.current.index = index;
  live.current.deckLength = deck.length;

  const clearAdvance = useCallback(() => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      endSession();
      clearAdvance();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const begin = useCallback(
    (pool: Q[]) => {
      clearAdvance();
      setDeck(pool.map((q) => ({ q, retry: false })));
      setIndex(0);
      setSubmitted(false);
      setLastCorrect(null);
      setScore({ correct: 0, incorrect: 0 });
      setXp(0);
      setWrongIds([]);
      setDone(false);
      setStarted(true);
      startSession();
    },
    [clearAdvance, startSession]
  );

  const next = useCallback(() => {
    clearAdvance();
    const nextIndex = live.current.index + 1;
    if (nextIndex >= live.current.deckLength) {
      endSession();
      setDone(true);
    } else {
      setIndex(nextIndex);
      setSubmitted(false);
      setLastCorrect(null);
    }
  }, [clearAdvance, endSession]);

  const submit = useCallback(
    (correct: boolean, answer?: string) => {
      const entry = deck[index];
      if (submitted || !entry) return;
      setSubmitted(true);
      setLastCorrect(correct);

      if (correct) {
        setBurst((b) => b + 1);
        playCorrect();
        if (autoAdvanceMs > 0) {
          clearAdvance();
          advanceTimer.current = setTimeout(() => next(), autoAdvanceMs);
        }
      } else {
        playWrong();
        if (requeueWrong) setDeck((d) => [...d, { q: entry.q, retry: true }]);
      }

      setXp((v) => v + (correct ? XP_PER_CORRECT : XP_PER_WRONG));
      if (!entry.retry) {
        if (!correct) setWrongIds((ids) => [...ids, getId(entry.q)]);
        setScore((s) => ({
          correct: s.correct + (correct ? 1 : 0),
          incorrect: s.incorrect + (correct ? 0 : 1),
        }));
      }

      // Fire-and-forget: a failed write shouldn't block the quiz.
      recordAttempt(getId(entry.q), getRecordType?.(entry.q) ?? mode, correct, answer).catch(
        (err) => console.error("recordAttempt failed", err)
      );
    },
    [deck, index, submitted, autoAdvanceMs, requeueWrong, clearAdvance, next, recordAttempt, getId, getRecordType, mode]
  );

  const exit = useCallback(() => {
    clearAdvance();
    endSession();
    setStarted(false);
    setDone(false);
  }, [clearAdvance, endSession]);

  const backToSetup = useCallback(() => {
    setStarted(false);
    setDone(false);
  }, []);

  const entry = deck[index];
  return {
    started,
    done,
    deck,
    index,
    current: entry?.q ?? null,
    currentIsRetry: entry?.retry ?? false,
    submitted,
    lastCorrect,
    score,
    xp,
    wrongIds,
    burst,
    begin,
    submit,
    next,
    exit,
    backToSetup,
  };
}
