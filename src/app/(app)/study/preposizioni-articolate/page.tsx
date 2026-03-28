import { preposizioniDrill } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import DrillQuiz from "@/components/DrillQuiz";

export default async function PreposizioniArticolatePage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "preposizioni").map((w) => w.contentId);
  return (
    <DrillQuiz
      title="Preposizioni Articolate"
      subtitle="Fill in the correct combined preposition + article."
      contentType="preposizioni"
      questions={preposizioniDrill}
      weakIds={weakIds}
    />
  );
}
