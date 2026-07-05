import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import TimeQuiz from "./TimeQuiz";

export default async function TimePage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId, "time") : [];
  const weakIds = weakItems.map((w) => w.contentId);
  return <TimeQuiz weakIds={weakIds} />;
}
