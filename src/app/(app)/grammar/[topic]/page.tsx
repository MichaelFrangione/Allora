import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Dumbbell } from "lucide-react";
import { grammar, conjugations } from "@/lib/content";
import { getTopic, exercisesForTopic, topicHasContent } from "../topics";
import { TopicContent } from "../GrammarBrowser";

// One reference page per Guide topic. Static study modes and /grammar/conjugations
// have their own folders and take precedence over this dynamic segment.
export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const t = getTopic(topic);
  if (!t || !topicHasContent(t)) notFound();

  const exercises = exercisesForTopic(t.id);

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 py-6">
      <Link
        href="/grammar"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Guide
      </Link>

      <div className="flex items-center gap-3">
        <span className="text-3xl leading-none" aria-hidden>{t.emoji}</span>
        <h1 className="text-2xl font-bold">{t.label}</h1>
      </div>

      {exercises.length > 0 && (
        <div className="space-y-2">
          {exercises.map((ex) => (
            <Link key={ex.slug} href={`/study/${ex.slug}`} className="block">
              <div className="flex items-center gap-3 rounded-xl border-2 border-primary bg-primary px-4 py-3 text-primary-foreground shadow-[0_4px_0_0_var(--primary-deep)] transition-all active:translate-y-[3px] active:shadow-none">
                <Dumbbell className="h-5 w-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Practice — {ex.title}</p>
                  <p className="truncate text-xs opacity-90">{ex.subtitle}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <TopicContent topic={t} rules={grammar} conjugations={conjugations} />
    </div>
  );
}
