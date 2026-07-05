"use client";

import { Button } from "@/components/ui/button";

export default function DoneScreen({
  score,
  xp,
  wrongCount,
  onRetry,
  onPracticeMissed,
  onBack,
  backLabel = "Back to Setup",
}: {
  /** First-attempt score; total = correct + incorrect. */
  score: { correct: number; incorrect: number };
  xp: number;
  wrongCount: number;
  onRetry: () => void;
  onPracticeMissed?: () => void;
  onBack: () => void;
  backLabel?: string;
}) {
  const total = score.correct + score.incorrect;
  const pct = total > 0 ? Math.round((score.correct / total) * 100) : 0;
  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6">
      <div className="text-5xl">{pct >= 70 ? "🎉" : "📚"}</div>
      <h1 className="text-2xl font-bold">{pct >= 70 ? "Bravissimo!" : "Done!"}</h1>
      <p className="font-display text-5xl font-bold text-primary">{pct}%</p>
      <p className="text-muted-foreground">
        {score.correct} / {total} correct first try
      </p>
      <div className="flex w-full max-w-xs justify-around rounded-2xl border-2 border-border bg-card py-3 shadow-[0_2px_0_0_var(--border-deep)]">
        <div className="text-center">
          <p className="font-display text-xl font-bold text-gold">+{xp}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">XP earned</p>
        </div>
        <div className="text-center">
          <p className="font-display text-xl font-bold">{pct}%</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">accuracy</p>
        </div>
      </div>
      <Button onClick={onRetry} className="w-full max-w-xs">
        Try Again
      </Button>
      {wrongCount > 0 && onPracticeMissed && (
        <Button
          variant="outline"
          onClick={onPracticeMissed}
          className="w-full max-w-xs border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
        >
          Practice {wrongCount} missed
        </Button>
      )}
      <Button variant="outline" onClick={onBack} className="w-full max-w-xs">
        {backLabel}
      </Button>
    </div>
  );
}
