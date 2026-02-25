import { vocab, getVocabTags } from "@/lib/content";
import VocabBrowser from "./VocabBrowser";

export default function VocabPage() {
  const tags = getVocabTags();
  return <VocabBrowser initialItems={vocab} tags={tags} />;
}
