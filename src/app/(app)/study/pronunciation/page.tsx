import { vocab, pronunciationRules } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import PronunciationDrill from "./PronunciationDrill";

export default async function PronunciationPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "pronunciation").map((w) => w.contentId);
  const items = vocab.filter((v) => v.pronunciation);
  return <PronunciationDrill items={items} weakIds={weakIds} rules={pronunciationRules} />;
}
