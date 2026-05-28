import { salutiDrill } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import DrillQuiz from "@/components/DrillQuiz";

export default async function SalutiPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "saluti").map((w) => w.contentId);
  return (
    <DrillQuiz
      title="Saluti"
      subtitle="Greetings & farewells — ciao, buongiorno, arrivederci…"
      instructions="Read the situation and choose the right Italian greeting or farewell for the time of day and level of formality."
      contentType="saluti"
      questions={salutiDrill}
      weakIds={weakIds}
      subjectId="greetings"
      categoryLabels={{
        saluti: "Saluti (greetings)",
        congedi: "Congedi (farewells)",
      }}
    />
  );
}
