// Server-only dedup checks for captured vocab. A word counts as a duplicate if it's already
// in the static content (already taught), or already in the VocabEntry table (staged/promoted).
import { prisma } from "@/lib/prisma";
import { vocab } from "@/lib/content";

const norm = (s: string) => s.toLowerCase().trim();

// Built once at module load from the static vocab.
const contentSet = new Set(vocab.map((v) => norm(v.italian)));

export type DedupWhere = "content" | "staged" | "promoted";
export type DedupStatus = { exists: boolean; where: DedupWhere | null };

export async function dedupStatus(italian: string): Promise<DedupStatus> {
  const key = norm(italian);
  if (!key) return { exists: false, where: null };
  if (contentSet.has(key)) return { exists: true, where: "content" };

  const existing = await prisma.vocabEntry.findFirst({
    where: { italian: { equals: italian.trim(), mode: "insensitive" } },
    select: { status: true },
  });
  if (existing) return { exists: true, where: existing.status === "PROMOTED" ? "promoted" : "staged" };

  return { exists: false, where: null };
}
