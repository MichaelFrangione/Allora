"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ACCENT_KEYS } from "@/lib/answer-check";

export default function TypedAnswer({
  value,
  onChange,
  onSubmit,
  submitted,
  correct,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  submitted: boolean;
  /** Whether the submitted answer was right (ignored before submit). */
  correct: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function insertAccent(ch: string) {
    const el = inputRef.current;
    if (!el) {
      onChange(value + ch);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + ch + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + ch.length, start + ch.length);
    });
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!submitted && value.trim()) onSubmit();
      }}
    >
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={submitted}
        placeholder="Type your answer…"
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        lang="it"
        className={cn(
          "h-12 text-base",
          submitted &&
            (correct
              ? "border-green-500 bg-green-50 dark:bg-green-950"
              : "border-red-400 bg-red-50 dark:bg-red-950")
        )}
      />
      <div className="flex flex-wrap gap-2">
        {ACCENT_KEYS.map((ch) => (
          <button
            key={ch}
            type="button"
            tabIndex={-1}
            disabled={submitted}
            onClick={() => insertAccent(ch)}
            className="h-9 w-9 rounded-lg border-2 border-border bg-card text-base font-medium transition-colors hover:bg-accent disabled:opacity-40"
          >
            {ch}
          </button>
        ))}
      </div>
      {!submitted && (
        <Button type="submit" className="w-full h-12" disabled={!value.trim()}>
          Check
        </Button>
      )}
    </form>
  );
}
