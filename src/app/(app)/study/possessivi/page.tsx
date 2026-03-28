import { possessiviDrill } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import DrillQuiz from "@/components/DrillQuiz";

export default async function PossessiviPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "possessivi").map((w) => w.contentId);
  return (
    <DrillQuiz
      title="Aggettivi Possessivi"
      subtitle="Pick the correct possessive adjective — Simpsons edition."
      contentType="possessivi"
      questions={possessiviDrill}
      weakIds={weakIds}
    />
  );
}
