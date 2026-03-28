import { piacereDrill } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import DrillQuiz from "@/components/DrillQuiz";

export default async function PiacerePage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "piacere").map((w) => w.contentId);
  return (
    <DrillQuiz
      title="Piacere"
      subtitle="Choose piace or piacciono — and form questions."
      contentType="piacere"
      questions={piacereDrill}
      weakIds={weakIds}
      categoryLabels={{
        "piace-piacciono": "Piace o Piacciono?",
        "con-pronomi": "Con i Pronomi",
        "fare-domande": "Fare Domande",
      }}
    />
  );
}
