import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { parseVocabLine } from "@/lib/parse-vocab";
import { conjugate, isItalianVerb, verbGroupOf } from "@/lib/conjugate";
import { dedupStatus } from "@/lib/vocab-dedup";
import { lookupMeaning } from "@/lib/dictionary";

// Look up a word WITHOUT saving it. Returns derived info so the client can preview
// before the user commits with the + button. Accepts a bare word, or "word - meaning"
// (the meaning is echoed back as a suggestion).
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = new URL(req.url).searchParams.get("word") ?? "";
  const parsed = parseVocabLine(q);
  if (!parsed.italian) {
    return NextResponse.json({ error: "Nothing to look up" }, { status: 400 });
  }

  const verb = isItalianVerb(parsed.italian);
  const conj = verb ? conjugate(parsed.italian) : null;

  // Meaning: prefer what the user typed after a dash; otherwise auto-fill from Wiktionary.
  let english = parsed.english;
  let englishSource: "input" | "wiktionary" | null = english ? "input" : null;
  if (!english) {
    const meaning = await lookupMeaning(parsed.italian);
    if (meaning) {
      english = meaning;
      englishSource = "wiktionary";
    }
  }

  const already = await dedupStatus(parsed.italian);

  return NextResponse.json({
    italian: parsed.italian,
    english,
    englishSource, // "input" | "wiktionary" | null
    isVerb: verb,
    partOfSpeech: verb ? "verb" : null,
    verbGroup: verb ? verbGroupOf(parsed.italian) : null,
    conjugation: conj,
    already, // { exists, where: "content" | "staged" | "promoted" | null }
  });
}
