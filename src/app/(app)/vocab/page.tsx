import { vocab } from "@/lib/content";
import VocabBrowser from "./VocabBrowser";

export default function VocabPage() {
  return <VocabBrowser initialItems={vocab} />;
}
