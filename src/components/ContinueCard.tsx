import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { NextUp } from "@/lib/progress";

/** One-tap "what should I do next" CTA fed by getNextUp(). */
export default function ContinueCard({ nextUp }: { nextUp: NextUp }) {
  return (
    <Link href={nextUp.href} className="group block">
      <div className="flex items-center gap-4 rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-[0_5px_0_0_var(--primary-deep)] transition-all group-hover:brightness-105 group-active:translate-y-[4px] group-active:shadow-none">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl">
          {nextUp.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-widest opacity-80">
            Continua
          </p>
          <p className="font-display text-lg font-bold leading-tight truncate">{nextUp.title}</p>
          <p className="text-xs opacity-85">{nextUp.detail}</p>
        </div>
        <ChevronRight className="h-6 w-6 shrink-0 opacity-90 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
