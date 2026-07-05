import { passatoProssimoDrill } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import DrillQuiz from "@/components/DrillQuiz";

export default async function PassatoProssimoPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems
    .filter((w) => w.contentType === "passato-prossimo")
    .map((w) => w.contentId);
  return (
    <DrillQuiz
      title="Passato Prossimo"
      subtitle="Talking about the past — ho mangiato, sono andato/a, mi sono svegliato"
      instructions="Pick the auxiliary (avere or essere), form the passato prossimo, or choose the irregular past participle. Remember: essere for movement, reflexive and change-of-state verbs — and with essere the participle agrees (è andata, siamo andati)."
      contentType="passato-prossimo"
      questions={passatoProssimoDrill}
      weakIds={weakIds}
      subjectId="passato-prossimo"
      categoryLabels={{
        ausiliare: "Avere o Essere?",
        forma: "Forma il passato prossimo",
        participio: "Participi irregolari",
      }}
    />
  );
}
