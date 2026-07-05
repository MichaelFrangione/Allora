import { vocab } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import FlashcardSession from "./FlashcardSession";

export default async function FlashcardsPage({
  searchParams,
}: {
  searchParams: Promise<{ weak?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId, "flashcard") : [];
  const weakIds = weakItems.map((w) => w.contentId);
  const params = await searchParams;
  const initialIds = params.weak === "1" ? weakIds : undefined;
  return <FlashcardSession vocab={vocab} weakIds={weakIds} initialIds={initialIds} />;
}
