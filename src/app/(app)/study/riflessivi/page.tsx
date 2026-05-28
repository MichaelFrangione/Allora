import { riflessiviDrill } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import DrillQuiz from "@/components/DrillQuiz";

export default async function RiflessiviPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "riflessivi").map((w) => w.contentId);
  return (
    <DrillQuiz
      title="Verbi Riflessivi"
      subtitle="Reflexive verbs — mi sveglio, ti vesti, si diverte…"
      instructions="Conjugate the reflexive verb for the given subject, or complete the daily-routine sentence with the right reflexive form (mi / ti / si / ci / vi / si)."
      contentType="riflessivi"
      questions={riflessiviDrill}
      weakIds={weakIds}
      subjectId="reflexive-verbs"
      categoryLabels={{
        coniugazione: "Coniugazione",
        "giornata-io": "La mia giornata (io)",
        "giornata-lui": "La sua giornata (lui/lei)",
      }}
    />
  );
}
