"use client";

import { cn } from "@/lib/utils";

/**
 * Presentational tap-to-build word area: a drop zone holding the built sentence
 * (tap a tile to send it back) plus the remaining pool of word tiles. The state
 * lives in the parent (see `useWordBuilder`); this only renders + reports taps.
 */
export default function WordBuilder({
  built,
  pool,
  checked,
  correct,
  onAdd,
  onRemove,
  emptyHint = "Tap words below to build the sentence",
}: {
  built: string[];
  pool: string[];
  checked: boolean;
  correct: boolean;
  onAdd: (word: string, index: number) => void;
  onRemove: (word: string, index: number) => void;
  emptyHint?: string;
}) {
  return (
    <>
      {/* Drop zone — built sentence */}
      <div
        className={cn(
          "min-h-16 rounded-xl border-2 border-dashed p-3 flex flex-wrap gap-2 transition-colors",
          checked && correct && "border-green-500 bg-green-50 dark:bg-green-950",
          checked && !correct && "border-red-400 bg-red-50 dark:bg-red-950",
          !checked && "border-border"
        )}
      >
        {built.length === 0 && (
          <p className="text-sm text-muted-foreground self-center w-full text-center">
            {emptyHint}
          </p>
        )}
        {built.map((word, i) => (
          <button
            key={`built-${i}`}
            onClick={() => onRemove(word, i)}
            className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium active:scale-95 transition-transform disabled:opacity-60"
            disabled={checked}
          >
            {word}
          </button>
        ))}
      </div>

      {/* Pool of available words */}
      <div className="flex flex-wrap gap-2">
        {pool.map((word, i) => (
          <button
            key={`pool-${i}-${word}`}
            onClick={() => onAdd(word, i)}
            className="px-4 py-2.5 rounded-lg border-2 border-border bg-background text-sm font-medium active:scale-95 transition-transform disabled:opacity-60"
            disabled={checked}
          >
            {word}
          </button>
        ))}
      </div>
    </>
  );
}
