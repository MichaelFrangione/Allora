// Server-side meaning lookup via the free Wiktionary REST API (no key). Returns a concise
// English gloss for an Italian word, or null on any failure (caller falls back to manual entry).
// Response shape: { it: [ { partOfSpeech, definitions: [ { definition: "<html>" } ] }, ... ], en: [...] }

const cleanGloss = (s: string) =>
  s
    .replace(/<[^>]+>/g, "") // strip HTML tags
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s*\[auxiliary[^\]]*\]/gi, "") // drop "[auxiliary avere]" — we show aux separately
    .replace(/\s+/g, " ")
    .trim();

type WiktionaryDef = { definition?: string };
type WiktionaryEntry = { partOfSpeech?: string; definitions?: WiktionaryDef[] };

export async function lookupMeaning(word: string): Promise<string | null> {
  const title = encodeURIComponent(word.toLowerCase().trim());
  if (!title) return null;

  try {
    const res = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${title}`, {
      headers: {
        "User-Agent": "Allora/1.0 (Italian study app; personal use)",
        Accept: "application/json",
      },
      // Meanings don't change — cache for a week.
      next: { revalidate: 604800 },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as Record<string, WiktionaryEntry[]>;
    const italian = data?.it;
    if (!Array.isArray(italian)) return null;

    for (const entry of italian) {
      for (const d of entry.definitions ?? []) {
        const clean = cleanGloss(d.definition ?? "");
        if (clean) return clean;
      }
    }
    return null;
  } catch {
    return null;
  }
}
