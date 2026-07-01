/**
 * Promote STAGED VocabEntry rows into the static content pipeline.
 *
 *   npx tsx scripts/promote-vocab.ts
 *
 * For every STAGED row it:
 *   - appends the word to data/vocab/added.json (Vocab browser, flashcards, and — via its subject
 *     tag — the Learn path / mastery), and
 *   - if it's a verb, appends a *presente* entry to data/conjugations/added.json so it shows up in
 *     the Conjugation drill.
 * Then it marks those rows PROMOTED. Run locally, then commit the updated data files.
 *
 * NOTE: this touches the prod DB (marks rows PROMOTED) — intended and non-destructive.
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();
const VOCAB_PATH = join(process.cwd(), "data", "vocab", "added.json");
const CONJ_PATH = join(process.cwd(), "data", "conjugations", "added.json");
const norm = (s: string) => s.toLowerCase().trim();

type VocabItem = {
  id: string;
  italian: string;
  english: string;
  gender: string | null;
  partOfSpeech: string;
  example: string;
  tags: string[];
};
type Conjugation = { id: string; verb: string; meaning: string; tense: string; forms: Record<string, string> };
type StoredConjugation = { tenses?: Record<string, Record<string, string>> } | null;

/** Build a presente Conjugation entry (drill shape uses the "lui/lei" pronoun key). */
function presenteEntry(id: string, verb: string, meaning: string, conjugation: StoredConjugation): Conjugation | null {
  const p = conjugation?.tenses?.PRESENTE;
  if (!p || !p.io) return null;
  return {
    id: `${id}-presente`,
    verb,
    meaning: meaning || verb,
    tense: "presente",
    forms: { io: p.io, tu: p.tu, "lui/lei": p.lui, noi: p.noi, voi: p.voi, loro: p.loro },
  };
}

async function main() {
  const staged = await prisma.vocabEntry.findMany({ where: { status: "STAGED" }, orderBy: { createdAt: "asc" } });
  if (staged.length === 0) {
    console.log("Nothing to promote — no STAGED entries.");
    return;
  }

  const vocab: VocabItem[] = JSON.parse(readFileSync(VOCAB_PATH, "utf8"));
  const conjs: Conjugation[] = JSON.parse(readFileSync(CONJ_PATH, "utf8"));
  const seenVocab = new Set(vocab.map((v) => norm(v.italian)));
  const seenConjVerb = new Set(conjs.map((c) => norm(c.verb)));

  const promotedIds: string[] = [];
  let addedVocab = 0;
  let addedConj = 0;

  for (const e of staged) {
    promotedIds.push(e.id);
    const key = norm(e.italian);

    if (!seenVocab.has(key)) {
      seenVocab.add(key);
      vocab.push({
        id: e.id,
        italian: e.italian,
        english: e.english,
        gender: e.gender ?? null,
        partOfSpeech: e.partOfSpeech ?? "",
        example: e.example ?? "",
        tags: e.tags ?? [],
      });
      addedVocab++;
    }

    const conjEntry = presenteEntry(e.id, e.italian, e.english, e.conjugation as StoredConjugation);
    if (conjEntry && !seenConjVerb.has(key)) {
      seenConjVerb.add(key);
      conjs.push(conjEntry);
      addedConj++;
    }
  }

  writeFileSync(VOCAB_PATH, JSON.stringify(vocab, null, 2) + "\n");
  writeFileSync(CONJ_PATH, JSON.stringify(conjs, null, 2) + "\n");

  await prisma.vocabEntry.updateMany({
    where: { id: { in: promotedIds } },
    data: { status: "PROMOTED", promotedAt: new Date() },
  });

  console.log(
    `Promoted ${promotedIds.length} row(s): +${addedVocab} vocab item(s), +${addedConj} conjugation drill(s). ` +
      `Commit the updated data/vocab/added.json and data/conjugations/added.json to ship them.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
