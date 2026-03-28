import { ristoranteDrill } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import DrillQuiz from "@/components/DrillQuiz";

export default async function RistorantePage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "ristorante").map((w) => w.contentId);
  return (
    <DrillQuiz
      title="Al Ristorante"
      subtitle="Complete the restaurant conversation."
      contentType="ristorante"
      questions={ristoranteDrill}
      weakIds={weakIds}
    />
  );
}
