// Server-side word lookup via the free Wiktionary APIs (no key). Returns nulls on any failure
// (caller falls back to manual entry / curated aux). Two sources, each for what it's good at:
//  - definition REST endpoint  → meaning + auxiliary ("[auxiliary avere]") + part of speech
//  - MediaWiki wikitext (nouns) → gender from the {{it-noun|m}} / {{it-noun|f}} headword template

const UA = "Allora/1.0 (Italian study app; personal use)";
const WEEK = 604800;

const stripTags = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

// Meaning without the "[auxiliary avere]" annotation (we surface aux separately).
const cleanGloss = (s: string) => s.replace(/\s*\[auxiliary[^\]]*\]/gi, "").replace(/\s+/g, " ").trim();

function extractAux(text: string): AuxHint | null {
  const m = text.match(/auxiliary\s+([^\]]+)/i);
  if (!m) return null;
  const clause = m[1].toLowerCase();
  const avere = /avere/.test(clause);
  const essere = /essere/.test(clause);
  if (avere && essere) return "BOTH";
  if (essere) return "ESSERE";
  if (avere) return "AVERE";
  return null;
}

type WiktDef = { definition?: string };
type WiktEntry = { partOfSpeech?: string; definitions?: WiktDef[] };

export type AuxHint = "AVERE" | "ESSERE" | "BOTH";
export type Gender = "m" | "f" | "mf";
export type WordInfo = {
  meaning: string | null;
  aux: AuxHint | null;
  gender: Gender | null;
  partOfSpeech: string | null;
};

async function fetchDefinition(word: string) {
  const title = encodeURIComponent(word.toLowerCase().trim());
  const res = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${title}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate: WEEK },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as Record<string, WiktEntry[]>;
  const italian = data?.it;
  if (!Array.isArray(italian)) return null;

  let meaning: string | null = null;
  let aux: AuxHint | null = null;
  let partOfSpeech: string | null = null;
  let hasNoun = false;

  for (const entry of italian) {
    if (!partOfSpeech && entry.partOfSpeech) partOfSpeech = entry.partOfSpeech;
    if (entry.partOfSpeech === "Noun") hasNoun = true;
    for (const d of entry.definitions ?? []) {
      const stripped = stripTags(d.definition ?? "");
      if (!aux && entry.partOfSpeech === "Verb") aux = extractAux(stripped);
      if (!meaning) {
        const gloss = cleanGloss(stripped);
        if (gloss) meaning = gloss;
      }
    }
  }
  return { meaning, aux, partOfSpeech, hasNoun };
}

async function fetchGender(word: string): Promise<Gender | null> {
  const title = encodeURIComponent(word.toLowerCase().trim());
  const res = await fetch(
    `https://en.wiktionary.org/w/api.php?action=parse&page=${title}&prop=wikitext&formatversion=2&format=json`,
    { headers: { "User-Agent": UA, Accept: "application/json" }, next: { revalidate: WEEK } },
  );
  if (!res.ok) return null;

  const data = (await res.json()) as { parse?: { wikitext?: string } };
  const wikitext = data?.parse?.wikitext;
  if (!wikitext) return null;

  const m = wikitext.match(/\{\{it-noun\|([^|}]+)/i);
  if (!m) return null;
  const g = m[1].toLowerCase();
  if (g.startsWith("mf") || g.startsWith("fm")) return "mf";
  if (g.startsWith("m")) return "m";
  if (g.startsWith("f")) return "f";
  return null;
}

export async function lookupWord(word: string): Promise<WordInfo> {
  try {
    const def = await fetchDefinition(word);
    let gender: Gender | null = null;
    if (def?.hasNoun) {
      try {
        gender = await fetchGender(word);
      } catch {
        // gender is a bonus — don't let its failure drop the meaning
      }
    }
    return {
      meaning: def?.meaning ?? null,
      aux: def?.aux ?? null,
      gender,
      partOfSpeech: def?.partOfSpeech ?? null,
    };
  } catch {
    return { meaning: null, aux: null, gender: null, partOfSpeech: null };
  }
}

/** Gender only — one wikitext call. Lighter than lookupWord for bulk noun imports. */
export async function lookupGender(word: string): Promise<Gender | null> {
  try {
    return await fetchGender(word);
  } catch {
    return null;
  }
}
