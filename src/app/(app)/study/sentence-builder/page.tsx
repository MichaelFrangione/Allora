import { sentences } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import SentenceBuilder from "./SentenceBuilder";

export default async function SentenceBuilderPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "sentence").map((w) => w.contentId);
  return <SentenceBuilder exercises={sentences} weakIds={weakIds} />;
}
