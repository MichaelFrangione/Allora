import { essereAvereDrill } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import DrillQuiz from "@/components/DrillQuiz";

export default async function EssereAverePage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "essere-avere").map((w) => w.contentId);
  return (
    <DrillQuiz
      title="Essere & Avere"
      subtitle="The two key verbs — and idioms like avere fame, sete, sonno."
      instructions="Choose the correct present-tense form of essere or avere — or the right noun for an avere idiom (avere fame, sete, sonno…)."
      contentType="essere-avere"
      questions={essereAvereDrill}
      weakIds={weakIds}
      subjectId="essere-avere"
      categoryLabels={{
        essere: "Essere",
        avere: "Avere",
        "espressioni-avere": "Espressioni con Avere",
      }}
    />
  );
}
