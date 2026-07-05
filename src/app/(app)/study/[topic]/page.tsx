import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getWeakItems, getLearnStats } from "@/lib/progress";
import { getDrill } from "@/lib/drills";
import DrillQuiz from "@/components/DrillQuiz";

/**
 * One route for every registry drill (see src/lib/drills.ts). Static study
 * modes (flashcards, conjugation, review…) live in their own folders and
 * take precedence over this dynamic segment.
 */
export default async function TopicDrillPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const drill = getDrill(topic);
  if (!drill) notFound();

  const session = await auth();
  const userId = session?.user?.id;
  const [weakItems, learnStats] = userId
    ? await Promise.all([getWeakItems(userId, drill.contentType), getLearnStats(userId)])
    : [[], null];
  const weakIds = weakItems.map((w) => w.contentId);

  // Once a subject is mastered to level 3+, default to typed answers (recall
  // beats recognition); the setup screen still lets the user switch back.
  const level = drill.subjectId ? (learnStats?.bySubject[drill.subjectId]?.level ?? 0) : 0;

  return (
    <DrillQuiz
      title={drill.title}
      subtitle={drill.subtitle}
      instructions={drill.instructions}
      contentType={drill.contentType}
      questions={drill.questions}
      weakIds={weakIds}
      subjectId={drill.subjectId}
      categoryLabels={drill.categoryLabels}
      defaultInputMode={level >= 3 ? "typed" : "choice"}
    />
  );
}
