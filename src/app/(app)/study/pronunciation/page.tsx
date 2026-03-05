import { vocab } from "@/lib/content";
import PronunciationDrill from "./PronunciationDrill";

export default function PronunciationPage() {
  // Only vocab items that have a pronunciation entry
  const items = vocab.filter((v) => v.pronunciation);
  return <PronunciationDrill items={items} />;
}
