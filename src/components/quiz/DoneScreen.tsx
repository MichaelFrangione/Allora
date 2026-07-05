"use client";

import { useEffect, useState } from "react";
import { motion, animate, type Variants } from "motion/react";
import { Button } from "@/components/ui/button";

/** Animated 0→target counter (rounded), for satisfying score reveals. */
function useCountUp(target: number, duration = 0.9): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const controls = animate(0, target, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [target, duration]);
  return value;
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item: Variants = {
  hidden: { y: 14, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 26 } },
};

const emojiPop: Variants = {
  hidden: { scale: 0, rotate: -12, opacity: 0 },
  show: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 320, damping: 14 },
  },
};

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
  const shownPct = useCountUp(pct);
  const shownXp = useCountUp(xp, 1.1);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6"
    >
      <motion.div variants={emojiPop} className="text-5xl">
        {pct >= 70 ? "🎉" : "📚"}
      </motion.div>
      <motion.h1 variants={item} className="text-2xl font-bold">
        {pct >= 70 ? "Bravissimo!" : "Done!"}
      </motion.h1>
      <motion.p variants={item} className="font-display text-5xl font-bold text-primary">
        {shownPct}%
      </motion.p>
      <motion.p variants={item} className="text-muted-foreground">
        {score.correct} / {total} correct first try
      </motion.p>
      <motion.div
        variants={item}
        className="flex w-full max-w-xs justify-around rounded-2xl border-2 border-border bg-card py-3 shadow-[0_2px_0_0_var(--border-deep)]"
      >
        <div className="text-center">
          <p className="font-display text-xl font-bold text-gold">+{shownXp}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">XP earned</p>
        </div>
        <div className="text-center">
          <p className="font-display text-xl font-bold">{shownPct}%</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">accuracy</p>
        </div>
      </motion.div>
      <motion.div variants={item} className="w-full max-w-xs">
        <Button onClick={onRetry} className="w-full">
          Try Again
        </Button>
      </motion.div>
      {wrongCount > 0 && onPracticeMissed && (
        <motion.div variants={item} className="w-full max-w-xs">
          <Button
            variant="outline"
            onClick={onPracticeMissed}
            className="w-full border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
          >
            Practice {wrongCount} missed
          </Button>
        </motion.div>
      )}
      <motion.div variants={item} className="w-full max-w-xs">
        <Button variant="outline" onClick={onBack} className="w-full">
          {backLabel}
        </Button>
      </motion.div>
    </motion.div>
  );
}
