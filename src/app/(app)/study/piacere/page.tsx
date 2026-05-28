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
      instructions="Choose piace or piacciono depending on whether the thing liked is singular or plural, and use the right indirect pronoun."
      contentType="piacere"
      questions={piacereDrill}
      weakIds={weakIds}
      subjectId="piacere"
      categoryLabels={{
        "piace-piacciono": "Piace o Piacciono?",
        "con-pronomi": "Con i Pronomi",
        "fare-domande": "Fare Domande",
      }}
    />
  );
}
