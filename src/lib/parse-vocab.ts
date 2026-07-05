// Pure parser for a captured vocab line. Safe to import on client (live preview) and server.
// Accepts formats like:  Rompere - to break  |  "rompere" – to break  |  casa: house  |  gatto = cat
export type ParsedVocab = { italian: string; english: string };

const stripQuotes = (t: string) => t.replace(/^["'“”«»]+|["'“”«»]+$/g, "").trim();

export function parseVocabLine(raw: string): ParsedVocab {
  const s = raw.trim();
  // Split on the first separator (dash variants, colon, or equals) surrounded by optional spaces.
  const m = s.match(/^(.*?)\s*[-–—:=]\s*(.*)$/);
  if (m && m[1].trim()) {
    return { italian: stripQuotes(m[1]), english: stripQuotes(m[2]) };
  }
  return { italian: stripQuotes(s), english: "" };
}

// Strip a leading Italian article so dictionary/example lookups match the bare word.
// "il ristorante" -> "ristorante", "l'amico" -> "amico", "gli studenti" -> "studenti".
export function stripArticle(s: string): string {
  const t = s.trim();
  const elided = t.match(/^(l'|un'|dell'|nell'|all'|dall')\s*/i);
  if (elided) return t.slice(elided[0].length).trim();
  const spaced = t.match(/^(il|lo|la|i|gli|le|un|uno|una|dei|degli|delle|del|dello|della)\s+/i);
  if (spaced) return t.slice(spaced[0].length).trim();
  return t;
}
