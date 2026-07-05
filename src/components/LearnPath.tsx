import Link from "next/link";
import { Flame, Zap } from "lucide-react";
import { SUBJECTS } from "@/lib/content";
import { LEARN_PATH } from "@/lib/drills";
import { DAILY_GOAL_XP, type LearnStats } from "@/lib/progress";
import { cn } from "@/lib/utils";

function GoalRing({ value, goal }: { value: number; goal: number }) {
  const pct = Math.min(1, value / goal);
  const r = 22;
  const circ = 2 * Math.PI * r;
  const done = pct >= 1;
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg className="h-14 w-14 -rotate-90" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" strokeWidth="5" className="stroke-muted" />
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          className={done ? "stroke-gold" : "stroke-primary"}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-base">
        {done ? "🏆" : "🎯"}
      </span>
    </div>
  );
}

// Winding zig-zag horizontal offsets (Duolingo-style path), cycled by index.
const OFFSETS = [0, 44, 64, 44, 0, -44, -64, -44];

const SUBJECT_BY_ID = new Map(SUBJECTS.map((s) => [s.id, s]));

export default function LearnPath({ stats }: { stats: LearnStats }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Stats header */}
      <div className="flex items-center justify-between rounded-2xl border-2 border-border bg-card px-5 py-3 mb-8">
        <div className="flex items-center gap-2">
          <Flame className={cn("h-6 w-6", stats.streak > 0 ? "text-orange-500" : "text-muted-foreground")} />
          <div>
            <p className="font-display text-lg font-bold leading-none">{stats.streak}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">day streak</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-gold" />
          <div>
            <p className="font-display text-lg font-bold leading-none">{stats.xp.toLocaleString()}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">total XP</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GoalRing value={stats.todayXp} goal={DAILY_GOAL_XP} />
          <div>
            <p className="font-display text-lg font-bold leading-none">{stats.todayXp}/{DAILY_GOAL_XP}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">daily goal</p>
          </div>
        </div>
      </div>

      {/* Winding lesson path */}
      <div className="flex flex-col items-center gap-7">
        {LEARN_PATH.map(({ subjectId, route }, i) => {
          const subject = SUBJECT_BY_ID.get(subjectId);
          if (!subject) return null;
          const progress = stats.bySubject[subjectId];
          const level = progress?.level ?? 0;
          const offset = OFFSETS[i % OFFSETS.length];
          const started = (progress?.attempts ?? 0) > 0;
          const mastered = level >= 5;

          return (
            <div
              key={subjectId}
              className="flex flex-col items-center gap-1.5"
              style={{ transform: `translateX(${offset}px)` }}
            >
              <Link
                href={route}
                aria-label={`${subject.label} — level ${level} of 5`}
                className={cn(
                  "relative flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 text-3xl transition-all active:translate-y-[3px] active:shadow-none",
                  mastered
                    ? "border-gold bg-gold/25 shadow-[0_4px_0_0_var(--gold-deep)]"
                    : started
                      ? "border-primary bg-primary/15 shadow-[0_4px_0_0_var(--primary-deep)]"
                      : "border-border bg-card shadow-[0_4px_0_0_var(--border-deep)] hover:bg-accent"
                )}
              >
                {subject.emoji}
                {mastered && (
                  <span className="absolute -top-1 -right-1 text-base">👑</span>
                )}
              </Link>
              <span className="text-xs font-semibold text-center">{subject.label}</span>
              <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full", mastered ? "bg-gold" : "bg-primary")}
                  style={{ width: `${(level / 5) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-8">
        Tap a topic to practise. Earn XP for every answer — fill the bar to master a topic. 👑
      </p>
    </div>
  );
}
