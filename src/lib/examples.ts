// Example sentences for a word: curated class examples (data/examples.json) come first, then
// Tatoeba (free API, real sentences + English translation, no key, no LLM) fills the rest.
// No source labels — the merged list is presented as one set.
import classExamplesData from "../../data/examples.json";

export type Example = { it: string; en: string };

type ClassExample = { it: string; en: string; terms: string[] };
const CLASS = classExamplesData as ClassExample[];
const norm = (s: string) => s.toLowerCase().trim();

function classExamplesFor(word: string): Example[] {
  const w = norm(word);
  return CLASS.filter((e) => e.terms.some((t) => norm(t) === w)).map((e) => ({ it: e.it, en: e.en }));
}

type TatoebaTranslation = { lang?: string; text?: string };
type TatoebaResult = { text?: string; translations?: TatoebaTranslation[][] };

async function tatoebaExamples(word: string, limit: number): Promise<Example[]> {
  const q = encodeURIComponent(word.toLowerCase().trim());
  try {
    const res = await fetch(
      `https://tatoeba.org/en/api_v0/search?from=ita&to=eng&query=${q}&sort=relevance&trans_to=eng&trans_filter=limit`,
      {
        headers: { "User-Agent": "Allora/1.0 (Italian study app)", Accept: "application/json" },
        next: { revalidate: 604800 },
      },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: TatoebaResult[] };
    const out: Example[] = [];
    for (const r of data.results ?? []) {
      const it = r.text?.trim();
      if (!it) continue;
      const en = (r.translations ?? []).flat().find((t) => t?.lang === "eng")?.text?.trim();
      if (!en) continue;
      out.push({ it, en });
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}

/** Class examples first, then Tatoeba, deduped by Italian text, capped at `limit`. */
export async function getExamples(word: string, limit = 6): Promise<Example[]> {
  const cls = classExamplesFor(word);
  const need = Math.max(0, limit - cls.length);
  const tat = need > 0 ? await tatoebaExamples(word, need + 2) : [];

  const seen = new Set(cls.map((e) => norm(e.it)));
  const merged = [...cls];
  for (const e of tat) {
    if (seen.has(norm(e.it))) continue;
    seen.add(norm(e.it));
    merged.push(e);
    if (merged.length >= limit) break;
  }
  return merged;
}
