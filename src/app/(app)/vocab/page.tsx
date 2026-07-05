import { vocab } from "@/lib/content";
import { verbClass } from "@/lib/conjugate";
import VocabBrowser from "./VocabBrowser";

export default function VocabPage() {
  // Precompute the conjugation group per verb (needs the dictionary — server only).
  const items = vocab.map((v) => ({
    ...v,
    verbClass: v.partOfSpeech === "verb" ? verbClass(v.italian) : null,
  }));
  return <VocabBrowser initialItems={items} />;
}
