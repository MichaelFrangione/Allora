import { vocab } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import VocabQuiz from "./VocabQuiz";

export default async function VocabStudyPage({
  searchParams,
}: {
  searchParams: Promise<{ weak?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "vocab").map((w) => w.contentId);
  const params = await searchParams;
  const initialIds = params.weak === "1" ? weakIds : undefined;
  return <VocabQuiz items={vocab} weakIds={weakIds} initialIds={initialIds} />;
}
