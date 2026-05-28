import { aggettiviDrill } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import DrillQuiz from "@/components/DrillQuiz";

export default async function AggettiviPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "aggettivi").map((w) => w.contentId);
  return (
    <DrillQuiz
      title="Gli Aggettivi"
      subtitle="Agreement (-o / -a / -i / -e) plus the special forms of bello and buono."
      instructions="Choose the adjective form that agrees with the noun in gender and number, including the special forms of bello and buono."
      contentType="aggettivi"
      questions={aggettiviDrill}
      weakIds={weakIds}
      subjectId="adjectives"
      categoryLabels={{
        concordanza: "Concordanza",
        bello: "Bello",
        buono: "Buono",
      }}
    />
  );
}
