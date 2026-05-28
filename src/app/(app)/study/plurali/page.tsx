import { pluraliDrill } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import DrillQuiz from "@/components/DrillQuiz";

export default async function PluraliPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "plurali").map((w) => w.contentId);
  return (
    <DrillQuiz
      title="Il Plurale dei Nomi"
      subtitle="Regular, spelling-change, and irregular plurals — i libri, le amiche, le uova."
      instructions="Give the correct plural form of each noun — watch for spelling changes (-co/-go, -cia/-gia) and irregular plurals."
      contentType="plurali"
      questions={pluraliDrill}
      weakIds={weakIds}
      subjectId="plural"
      categoryLabels={{
        "plurale-regolare": "Regolare",
        "plurale-ortografia": "Ortografia (-co / -cia)",
        "plurale-irregolare": "Irregolare",
        invariabile: "Invariabile",
      }}
    />
  );
}
