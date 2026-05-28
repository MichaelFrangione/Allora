import { genereDrill } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import DrillQuiz from "@/components/DrillQuiz";

export default async function GenerePage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "genere").map((w) => w.contentId);
  return (
    <DrillQuiz
      title="Il Genere dei Nomi"
      subtitle="Masculine or feminine? Endings, exceptions, and tricky -ma / -ista nouns."
      instructions="Decide whether each noun is masculine or feminine (using its ending), and choose its article."
      contentType="genere"
      questions={genereDrill}
      weakIds={weakIds}
      subjectId="gender"
      categoryLabels={{
        "maschile-o-femminile": "Maschile o Femminile?",
        "il-genere": "Il Genere",
        eccezioni: "Eccezioni",
      }}
    />
  );
}
