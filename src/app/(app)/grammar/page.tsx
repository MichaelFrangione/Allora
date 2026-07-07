import Link from "next/link";
import { ChevronRight, TableIcon, Dumbbell } from "lucide-react";
import { VISIBLE_TOPICS, exercisesForTopic } from "./topics";

// The Guide index: every topic opens its own page (/grammar/<id>).
export default function GrammarIndexPage() {
  return (
    <div className="mx-auto max-w-lg space-y-2 px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold">Guide</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Pick a topic to see its rules, examples and quick practice.
      </p>

      <Link href="/grammar/conjugations" className="block">
        <div className="mb-3 flex items-center justify-between rounded-xl border bg-card px-4 py-3 shadow-[0_3px_0_0_var(--border-deep)] transition-all hover:bg-muted/40 active:translate-y-[3px] active:shadow-none">
          <div className="flex items-center gap-3">
            <TableIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">Verb Conjugations</p>
              <p className="text-xs text-muted-foreground">All conjugation tables — searchable</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </Link>

      <ul className="space-y-2">
        {VISIBLE_TOPICS.map((t) => {
          const hasExercises = exercisesForTopic(t.id).length > 0;
          return (
            <li key={t.id}>
              <Link href={`/grammar/${t.id}`} className="block">
                <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-[0_3px_0_0_var(--border-deep)] transition-all hover:bg-muted/40 active:translate-y-[3px] active:shadow-none">
                  <span className="text-xl leading-none" aria-hidden>{t.emoji}</span>
                  <span className="min-w-0 flex-1 text-sm font-semibold">{t.label}</span>
                  {hasExercises && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      <Dumbbell className="h-3 w-3" />
                      Practice
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
