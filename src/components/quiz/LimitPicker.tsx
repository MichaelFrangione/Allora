"use client";

import { cn } from "@/lib/utils";
import { LIMIT_OPTIONS } from "@/lib/useQuizEngine";

export default function LimitPicker({
  value,
  onChange,
  label = "Questions per session",
  allCount,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  label?: string;
  /** When set, the "All" chip shows the pool size. */
  allCount?: number;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {LIMIT_OPTIONS.map((l) => (
          <button
            key={l ?? "all"}
            onClick={() => onChange(l)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              value === l
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {l ?? (allCount !== undefined ? `All ${allCount}` : "All")}
          </button>
        ))}
      </div>
    </div>
  );
}
