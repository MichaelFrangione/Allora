import { useCallback, useState } from "react";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Normalises a built/target sentence for comparison: collapses whitespace and
 * drops trailing sentence punctuation (., ?, !), which aren't tappable tokens.
 */
export function normalizeSentence(s: string): string {
  return s.replace(/\s+/g, " ").trim().replace(/[.?!]+$/, "");
}

/** True if `built` matches the target Italian (or any accepted alternate ordering). */
export function checkSentence(built: string, italian: string, alternates?: string[]): boolean {
  const accepted = [italian, ...(alternates ?? [])].map(normalizeSentence);
  return accepted.includes(normalizeSentence(built));
}

/**
 * Tap-to-build word-tile state shared by the Sentence Builder and the picture
 * description "build" mode. `load` (re)shuffles a fresh pool; tiles move between
 * the pool and the built sentence as the user taps them.
 */
export function useWordBuilder() {
  const [built, setBuilt] = useState<string[]>([]);
  const [pool, setPool] = useState<string[]>([]);

  const load = useCallback((parts: string[], distractors: string[]) => {
    setBuilt([]);
    setPool(shuffle([...parts, ...distractors]));
  }, []);

  const addWord = useCallback((word: string, index: number) => {
    setBuilt((b) => [...b, word]);
    setPool((p) => p.filter((_, i) => i !== index));
  }, []);

  const removeWord = useCallback((word: string, index: number) => {
    setBuilt((b) => b.filter((_, i) => i !== index));
    setPool((p) => [...p, word]);
  }, []);

  return { built, pool, load, addWord, removeWord, builtSentence: built.join(" ") };
}
