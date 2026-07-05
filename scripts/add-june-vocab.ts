/**
 * One-off importer: enrich scripts/june-vocab.json (curated from the June class notes) and append
 * to data/vocab/added.json. Gender comes from Wiktionary (nouns); POS is detected when not given.
 * Dedupes against the existing static vocab AND already-added items (article-insensitive), so
 * re-running is safe and nothing doubles up.
 *
 *   npx tsx scripts/add-june-vocab.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { vocab } from "../src/lib/content";
import { isItalianVerb } from "../src/lib/conjugate";
import { lookupGender } from "../src/lib/dictionary";
import { stripArticle } from "../src/lib/parse-vocab";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Gender with a retry — Wikimedia throttles rapid bursts, so pace + retry once.
async function genderWithRetry(term: string): Promise<string | null> {
  let g = await lookupGender(term);
  if (g === null) {
    await sleep(1200);
    g = await lookupGender(term);
  }
  return g;
}

type Source = { it: string; en: string; subject: string; pos?: string; gender?: string };
type VocabItem = {
  id: string;
  italian: string;
  english: string;
  gender: string | null;
  partOfSpeech: string;
  example: string;
  tags: string[];
};

const ADDED = join(process.cwd(), "data", "vocab", "added.json");
const norm = (s: string) => s.toLowerCase().trim();
const keyOf = (s: string) => norm(stripArticle(s));
const slug = (s: string) => "jun-" + norm(s).replace(/[^a-z0-9]/g, "");

async function main() {
  const src: Source[] = JSON.parse(readFileSync(join(process.cwd(), "scripts", "june-vocab.json"), "utf8"));
  const added: VocabItem[] = JSON.parse(readFileSync(ADDED, "utf8"));

  const seen = new Set<string>([...vocab.map((v) => keyOf(v.italian)), ...added.map((v) => keyOf(v.italian))]);

  let addedCount = 0;
  const skipped: string[] = [];

  for (const s of src) {
    const k = keyOf(s.it);
    if (seen.has(k)) {
      skipped.push(s.it);
      continue;
    }
    seen.add(k);

    const term = stripArticle(s.it);
    let pos = s.pos;
    if (!pos) pos = isItalianVerb(term) ? "verb" : term.endsWith("mente") ? "adverb" : "noun";

    // Prefer the authored gender; only fall back to Wiktionary for a noun missing one.
    let gender: string | null = s.gender ?? null;
    if (!gender && pos === "noun") {
      gender = await genderWithRetry(term);
      await sleep(350);
    }

    added.push({
      id: slug(s.it),
      italian: s.it,
      english: s.en,
      gender,
      partOfSpeech: pos,
      example: "",
      tags: s.subject ? [s.subject] : [],
    });
    addedCount++;
  }

  writeFileSync(ADDED, JSON.stringify(added, null, 2) + "\n");
  console.log(`Added ${addedCount} new vocab item(s). Skipped ${skipped.length} already present:`);
  console.log("  " + skipped.join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
