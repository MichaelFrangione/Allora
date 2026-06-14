"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { glossFor } from "@/lib/glossary";

/** Gloss for a tile, falling back to the part after an apostrophe (e.g. "l'uomo" → "uomo"). */
function tileGloss(word: string): string | undefined {
  const direct = glossFor(word);
  if (direct) return direct;
  if (word.includes("'")) return glossFor(word.split("'").pop() ?? "");
  return undefined;
}

const LONG_PRESS_MS = 400;

/**
 * A single word tile. A quick tap places/removes it (via `onActivate`); a
 * press-and-hold reveals the translation tooltip without placing — the native
 * touch callout / context menu is suppressed so the hold isn't hijacked.
 */
function Tile({
  word,
  gloss,
  disabled,
  onActivate,
  className,
  underlineClass,
}: {
  word: string;
  gloss: string | undefined;
  disabled: boolean;
  onActivate: () => void;
  className: string;
  underlineClass: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const longPressed = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimer() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }
  useEffect(() => clearTimer, []);

  function handlePointerDown() {
    longPressed.current = false;
    if (!gloss) return;
    clearTimer();
    timer.current = setTimeout(() => {
      longPressed.current = true;
      setRevealed(true);
    }, LONG_PRESS_MS);
  }

  function endPress() {
    clearTimer();
    setRevealed(false);
  }

  function handleClick() {
    clearTimer();
    // A hold already fired — swallow the click so the tile isn't placed.
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    setRevealed(false);
    onActivate();
  }

  return (
    <span className="relative inline-flex">
      {revealed && gloss && (
        <span
          role="tooltip"
          className="absolute left-1/2 bottom-full z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-normal text-background shadow-lg"
        >
          {gloss}
        </span>
      )}
      <button
        type="button"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        onPointerCancel={endPress}
        onContextMenu={(e) => e.preventDefault()}
        disabled={disabled}
        title={gloss}
        className={cn(className, "select-none [-webkit-touch-callout:none]")}
      >
        {gloss ? <span className={underlineClass}>{word}</span> : word}
      </button>
    </span>
  );
}

/**
 * Presentational tap-to-build word area: a drop zone holding the built sentence
 * (tap a tile to send it back) plus the remaining pool of word tiles. The state
 * lives in the parent (see `useWordBuilder`); this only renders + reports taps.
 * Each glossable tile reveals its translation on press-and-hold (or hover).
 */
export default function WordBuilder({
  built,
  pool,
  checked,
  correct,
  onAdd,
  onRemove,
  slots,
  emptyHint = "Tap words below to build the sentence",
}: {
  built: string[];
  pool: string[];
  checked: boolean;
  correct: boolean;
  onAdd: (word: string, index: number) => void;
  onRemove: (word: string, index: number) => void;
  /** When set, show this many hangman-style blanks so the expected word count is unambiguous. */
  slots?: number;
  emptyHint?: string;
}) {
  const showSlots = typeof slots === "number" && slots > 0;
  const blanks = showSlots ? Math.max(0, slots - built.length) : 0;
  return (
    <>
      {/* Drop zone — built sentence (with hangman blanks for any remaining words) */}
      <div
        className={cn(
          "min-h-16 rounded-xl border-2 border-dashed p-3 flex flex-wrap gap-2 transition-colors",
          showSlots && "items-center",
          checked && correct && "border-green-500 bg-green-50 dark:bg-green-950",
          checked && !correct && "border-red-400 bg-red-50 dark:bg-red-950",
          !checked && "border-border"
        )}
      >
        {!showSlots && built.length === 0 && (
          <p className="text-sm text-muted-foreground self-center w-full text-center">
            {emptyHint}
          </p>
        )}
        {built.map((word, i) => (
          <Tile
            key={`built-${i}`}
            word={word}
            gloss={tileGloss(word)}
            disabled={checked}
            onActivate={() => onRemove(word, i)}
            className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium active:scale-95 transition-transform disabled:opacity-60"
            underlineClass="border-b border-dotted border-primary-foreground/50"
          />
        ))}
        {Array.from({ length: blanks }).map((_, i) => (
          <span
            key={`blank-${i}`}
            aria-hidden
            className="inline-flex h-10 w-12 items-end justify-center"
          >
            <span className="block w-9 border-b-2 border-dashed border-muted-foreground/40" />
          </span>
        ))}
      </div>

      {/* Pool of available words */}
      <div className="flex flex-wrap gap-2">
        {pool.map((word, i) => (
          <Tile
            key={`pool-${i}-${word}`}
            word={word}
            gloss={tileGloss(word)}
            disabled={checked}
            onActivate={() => onAdd(word, i)}
            className="px-4 py-2.5 rounded-lg border-2 border-border bg-background text-sm font-medium active:scale-95 transition-transform disabled:opacity-60"
            underlineClass="border-b border-dotted border-muted-foreground/50"
          />
        ))}
      </div>
    </>
  );
}
