import { conjugations, getConjugationVerbs, getConjugationTenses } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import ConjugationDrill from "./ConjugationDrill";

export default async function ConjugationPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "conjugation").map((w) => w.contentId);
  const verbs = getConjugationVerbs();
  const tenses = getConjugationTenses();
  return <ConjugationDrill conjugations={conjugations} verbs={verbs} tenses={tenses} weakIds={weakIds} />;
}
