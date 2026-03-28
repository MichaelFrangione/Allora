import { alBarDrill } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import DrillQuiz from "@/components/DrillQuiz";

export default async function AlBarPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "al-bar").map((w) => w.contentId);
  return (
    <DrillQuiz
      title="Al Bar"
      subtitle="ISC verbs and piacere translation exercises."
      contentType="al-bar"
      questions={alBarDrill}
      weakIds={weakIds}
      categoryLabels={{
        "verbi-isc": "Verbi in -ISC",
        "piacere-traduzione": "Traduci con Piacere",
      }}
    />
  );
}
