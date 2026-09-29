import { auth } from "@/lib/auth";
import { getWeakItems } from "@/lib/progress";
import { townMap } from "@/lib/content";
import MapGame from "./MapGame";

export default async function MappaPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const weakItems = userId ? await getWeakItems(userId, "mappa") : [];
  const weakIds = weakItems.map((w) => w.contentId);
  return <MapGame map={townMap} weakIds={weakIds} />;
}
