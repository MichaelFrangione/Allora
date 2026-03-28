import { modalVerbs } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import ModalVerbsQuiz from "./ModalVerbsQuiz";

export default async function ModalVerbsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems
    .filter((w) => w.contentType === "modal-verbs")
    .map((w) => w.contentId);
  return <ModalVerbsQuiz questions={modalVerbs} weakIds={weakIds} />;
}
