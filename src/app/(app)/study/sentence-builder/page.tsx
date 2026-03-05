import { sentences } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import SentenceBuilder from "./SentenceBuilder";

export default async function SentenceBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ weak?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "sentence").map((w) => w.contentId);
  const params = await searchParams;
  const initialIds = params.weak === "1" ? weakIds : undefined;
  return <SentenceBuilder exercises={sentences} weakIds={weakIds} initialIds={initialIds} />;
}
