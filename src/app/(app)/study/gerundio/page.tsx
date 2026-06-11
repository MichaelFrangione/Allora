import { gerundioDrill } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import DrillQuiz from "@/components/DrillQuiz";

export default async function GerundioPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "gerundio").map((w) => w.contentId);
  return (
    <DrillQuiz
      title="Il Gerundio"
      subtitle="-ando / -endo, stare + gerundio, and the four uses"
      instructions="Form the gerund (-ARE → -ando, -ERE/-IRE → -endo), memorize the irregular forms (facendo, dicendo, bevendo…), use STARE + gerund for actions in progress (sto mangiando = I am eating), and recognise the four uses: simultaneity, manner, cause, condition."
      contentType="gerundio"
      questions={gerundioDrill}
      weakIds={weakIds}
      subjectId="gerundio"
      categoryLabels={{
        formazione: "Formazione (-ando / -endo)",
        irregolari: "Forme irregolari",
        progressivo: "Stare + gerundio",
        usi: "Usi del gerundio",
      }}
    />
  );
}
