import { interrogativiDrill } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import DrillQuiz from "@/components/DrillQuiz";

export default async function InterrogativiPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "interrogativi").map((w) => w.contentId);
  return (
    <DrillQuiz
      title="Interrogativi"
      subtitle="Question words — chi, cosa, come, quando, dove…"
      instructions="Choose the correct Italian question word to complete each sentence (who, what, where, when, why, how, which, how much/many)."
      contentType="interrogativi"
      questions={interrogativiDrill}
      weakIds={weakIds}
      subjectId="interrogatives"
      categoryLabels={{
        scegli: "Completa la domanda",
        traduzione: "Traduzione",
      }}
    />
  );
}
