"use client";

import type { Subject } from "@/lib/content";

interface SubjectSelectorProps {
  /** The subjects actually present in the current content. */
  subjects: Subject[];
  value: string | undefined;
  onChange: (subject: string | undefined) => void;
}

export default function SubjectSelector({ subjects, value, onChange }: SubjectSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(undefined)}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          !value
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
      >
        All
      </button>
      {subjects.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            value === s.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <span className="mr-1">{s.emoji}</span>
          {s.label}
        </button>
      ))}
    </div>
  );
}
