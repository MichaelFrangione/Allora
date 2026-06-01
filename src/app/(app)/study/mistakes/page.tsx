import Link from "next/link";
import { auth } from "@/lib/auth";
import { getMistakeItems } from "@/lib/progress";
import { DRILL_BY_TYPE } from "@/lib/content";
import type { DrillQuestion } from "@/lib/content";
import { Button } from "@/components/ui/button";
import DrillQuiz from "@/components/DrillQuiz";

export default async function MistakesPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const mistakes = userId ? await getMistakeItems(userId) : [];

  // Resolve each missed item back to its drill question, tagged so re-answers
  // record under the original contentType (and clear the item when mastered).
  const questions: DrillQuestion[] = [];
  const seen = new Set<string>();
  for (const m of mistakes) {
    const pool = DRILL_BY_TYPE[m.contentType];
    if (!pool) continue;
    const q = pool.find((x) => x.id === m.contentId);
    if (!q) continue;
    const key = `${m.contentType}::${m.contentId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    questions.push({ ...q, sourceType: m.contentType });
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
        <div className="text-5xl">🌟</div>
        <h1 className="text-2xl font-bold">No mistakes to review</h1>
        <p className="text-muted-foreground text-sm">
          Nice — you have no missed questions right now. Keep practising and anything you slip up on
          will show up here to retry.
        </p>
        <Link href="/study/focused" className="w-full max-w-xs">
          <Button className="w-full">Browse drills</Button>
        </Link>
      </div>
    );
  }

  return (
    <DrillQuiz
      title="Your Mistakes"
      subtitle={`${questions.length} question${questions.length !== 1 ? "s" : ""} you've missed — let's fix them.`}
      instructions="These are questions you've gotten wrong across all drills. Answer one correctly to clear it from your mistakes."
      contentType="mistakes"
      questions={questions}
    />
  );
}
