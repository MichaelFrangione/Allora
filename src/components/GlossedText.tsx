"use client";

import { useState } from "react";
import { glossFor } from "@/lib/glossary";

function GlossWord({ word, translation }: { word: string; translation: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onBlur={() => setOpen(false)}
        aria-label={`${word} — ${translation}`}
        className="border-b border-dotted border-primary/70 hover:border-primary transition-colors"
      >
        {word}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 bottom-full z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-normal text-background shadow-lg"
        >
          {translation}
        </span>
      )}
    </span>
  );
}

/**
 * Renders Italian text with known words shown as dotted-underlined,
 * tap-to-reveal English translations (via the glossary).
 */
export default function GlossedText({ text }: { text: string }) {
  // Split into word / non-word segments, keeping accented Italian letters together.
  const segments = text.split(/([A-Za-zàèéìòùÀÈÉÌÒÙ]+)/);
  return (
    <>
      {segments.map((seg, i) => {
        const translation = glossFor(seg);
        return translation ? (
          <GlossWord key={i} word={seg} translation={translation} />
        ) : (
          <span key={i}>{seg}</span>
        );
      })}
    </>
  );
}
