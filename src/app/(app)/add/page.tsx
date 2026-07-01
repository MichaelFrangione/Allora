import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AddVocab, { type StagedEntry } from "./AddVocab";

export const dynamic = "force-dynamic";

export default async function AddPage() {
  const session = await auth();

  const rows = session?.user?.id
    ? await prisma.vocabEntry.findMany({
        where: { status: "STAGED" },
        orderBy: { createdAt: "desc" },
        take: 200,
      })
    : [];

  // Serialize Prisma Date/Json for the client component.
  const initialStaged = JSON.parse(JSON.stringify(rows)) as StagedEntry[];

  return <AddVocab initialStaged={initialStaged} />;
}
