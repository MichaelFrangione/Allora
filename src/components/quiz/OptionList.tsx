"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function OptionList({
  options,
  selected,
  submitted,
  correct,
  onSelect,
  className = "grid grid-cols-2 gap-3",
  optionClassName = "text-base px-4 py-4",
}: {
  options: string[];
  selected: string | null;
  submitted: boolean;
  correct: string;
  onSelect: (v: string) => void;
  className?: string;
  optionClassName?: string;
}) {
  return (
    <RadioGroup
      value={selected ?? ""}
      onValueChange={(v) => {
        if (!submitted) onSelect(v);
      }}
      className={className}
    >
      {options.map((opt) => {
        let optClass = "border-border";
        if (submitted) {
          if (opt === correct) optClass = "border-green-500 bg-green-50 dark:bg-green-950";
          else if (opt === selected) optClass = "border-red-400 bg-red-50 dark:bg-red-950";
        }
        return (
          <Label
            key={opt}
            htmlFor={`opt-${opt}`}
            className={cn(
              "flex items-center gap-3 border-2 rounded-xl cursor-pointer transition-all",
              !submitted &&
                "bg-card shadow-[0_3px_0_0_var(--border-deep)] hover:bg-accent/60 active:translate-y-[2px] active:shadow-none",
              optionClassName,
              optClass,
              !submitted && selected === opt && "border-primary bg-primary/10"
            )}
          >
            <RadioGroupItem value={opt} id={`opt-${opt}`} />
            <span className="font-medium">{opt}</span>
          </Label>
        );
      })}
    </RadioGroup>
  );
}
