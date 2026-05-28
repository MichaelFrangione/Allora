import { pronomiDrill } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import DrillQuiz from "@/components/DrillQuiz";

export default async function PronomiPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "pronomi").map((w) => w.contentId);
  return (
    <DrillQuiz
      title="Pronomi"
      subtitle="Subject, reflexive, direct- and indirect-object pronouns."
      instructions="Replace the highlighted noun with the correct pronoun, or choose the right subject, object, or reflexive pronoun for the sentence."
      contentType="pronomi"
      questions={pronomiDrill}
      weakIds={weakIds}
      subjectId="pronouns"
      categoryLabels={{
        soggetto: "Soggetto",
        "oggetto-diretto": "Oggetto Diretto",
        "oggetto-indiretto": "Oggetto Indiretto",
        riflessivi: "Riflessivi",
      }}
    />
  );
}
