import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { NextUp } from "@/lib/progress";

/** One-tap "what should I do next" CTA fed by getNextUp(). */
export default function ContinueCard({ nextUp }: { nextUp: NextUp }) {
  return (
    <Link href={nextUp.href} className="block">
      <div className="flex items-center gap-4 rounded-2xl border-2 border-primary/50 bg-primary/5 px-5 py-4 transition-colors hover:bg-primary/10">
        <div className="text-3xl">{nextUp.emoji}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Continue</p>
          <p className="font-semibold truncate">{nextUp.title}</p>
          <p className="text-xs text-muted-foreground">{nextUp.detail}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </div>
    </Link>
  );
}
