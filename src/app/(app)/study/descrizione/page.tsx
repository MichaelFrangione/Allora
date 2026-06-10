import { imageDescriptions } from "@/lib/content";
import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import ImageDescriptionQuiz from "./ImageDescriptionQuiz";

export default async function DescrizionePage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId) : [];
  const weakIds = weakItems.filter((w) => w.contentType === "descrizione").map((w) => w.contentId);
  return <ImageDescriptionQuiz images={imageDescriptions} weakIds={weakIds} />;
}
