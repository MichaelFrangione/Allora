"use client";

import { UNITS } from "@/lib/content";

interface UnitSelectorProps {
  value: number | undefined;
  onChange: (unit: number | undefined) => void;
}

export default function UnitSelector({ value, onChange }: UnitSelectorProps) {
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
        All Units
      </button>
      {UNITS.map((u) => (
        <button
          key={u}
          onClick={() => onChange(u)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            value === u
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Unit {u}
        </button>
      ))}
    </div>
  );
}
