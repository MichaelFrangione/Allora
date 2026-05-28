import { articoliDrill } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import DrillQuiz from "@/components/DrillQuiz";

export default async function ArticoliPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "articoli").map((w) => w.contentId);
  return (
    <DrillQuiz
      title="Articoli"
      subtitle="Definite, indefinite, and partitive articles — il / lo / un / dei…"
      instructions="Choose the correct article for each noun, based on its gender and the letter it starts with."
      contentType="articoli"
      questions={articoliDrill}
      weakIds={weakIds}
      subjectId="articles"
      categoryLabels={{
        "determinativo-singolare": "Determinativo · Singolare",
        "determinativo-plurale": "Determinativo · Plurale",
        indeterminativo: "Indeterminativo",
        partitivo: "Partitivo (dei/degli/delle)",
      }}
    />
  );
}
