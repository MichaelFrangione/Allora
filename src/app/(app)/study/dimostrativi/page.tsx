import { dimostrativiDrill } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import DrillQuiz from "@/components/DrillQuiz";

export default async function DimostrativiPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "dimostrativi").map((w) => w.contentId);
  return (
    <DrillQuiz
      title="Dimostrativi"
      subtitle="This & that — questo, questa, quello, quelli…"
      instructions="Pick the form of questo (this) or quello (that) that agrees with the noun's gender and number."
      contentType="dimostrativi"
      questions={dimostrativiDrill}
      weakIds={weakIds}
      subjectId="demonstratives"
      categoryLabels={{
        "questo-quello": "Questo o Quello?",
        traduzione: "Traduzione",
      }}
    />
  );
}
