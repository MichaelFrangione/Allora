/**
 * Promote STAGED VocabEntry rows into the static content pipeline.
 *
 *   npx tsx scripts/promote-vocab.ts
 *
 * Reads all STAGED rows from the DB, appends them to data/vocab/added.json (which content.ts
 * imports, so they show up in the app after a build/deploy), then marks those rows PROMOTED.
 * Run locally, then commit the updated added.json.
 *
 * NOTE: this touches the prod DB (marks rows PROMOTED) — that's intended and non-destructive.
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();
const ADDED_PATH = join(process.cwd(), "data", "vocab", "added.json");

type VocabItem = {
  id: string;
  italian: string;
  english: string;
  gender: string | null;
  partOfSpeech: string;
  example: string;
  tags: string[];
};

async function main() {
  const staged = await prisma.vocabEntry.findMany({
    where: { status: "STAGED" },
    orderBy: { createdAt: "asc" },
  });

  if (staged.length === 0) {
    console.log("Nothing to promote — no STAGED entries.");
    return;
  }

  const existing: VocabItem[] = JSON.parse(readFileSync(ADDED_PATH, "utf8"));
  const seen = new Set(existing.map((v) => v.italian.toLowerCase().trim()));

  const promotedIds: string[] = [];
  let addedCount = 0;

  for (const e of staged) {
    promotedIds.push(e.id);
    const key = e.italian.toLowerCase().trim();
    if (seen.has(key)) continue; // already in the file (e.g. re-run) — still mark promoted
    seen.add(key);
    existing.push({
      id: e.id,
      italian: e.italian,
      english: e.english,
      gender: e.gender ?? null,
      partOfSpeech: e.partOfSpeech ?? "",
      example: e.example ?? "",
      tags: e.tags ?? [],
    });
    addedCount++;
  }

  writeFileSync(ADDED_PATH, JSON.stringify(existing, null, 2) + "\n");

  await prisma.vocabEntry.updateMany({
    where: { id: { in: promotedIds } },
    data: { status: "PROMOTED", promotedAt: new Date() },
  });

  console.log(
    `Promoted ${promotedIds.length} staged row(s): added ${addedCount} new item(s) to added.json ` +
      `(${promotedIds.length - addedCount} were already present). Commit the updated file to ship them.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
