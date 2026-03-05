import { concordanza } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import ConcordanzaQuiz from "./ConcordanzaQuiz";

export default async function ConcordanzaPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "concordanza").map((w) => w.contentId);
  return <ConcordanzaQuiz questions={concordanza} weakIds={weakIds} />;
}
