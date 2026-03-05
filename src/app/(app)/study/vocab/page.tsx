import { vocab } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import VocabQuiz from "./VocabQuiz";

export default async function VocabStudyPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "vocab").map((w) => w.contentId);
  return <VocabQuiz items={vocab} weakIds={weakIds} />;
}
