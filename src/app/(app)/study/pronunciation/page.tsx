import { pronunciationRules } from "@/lib/content";
import PronunciationDrill from "./PronunciationDrill";

export default function PronunciationPage() {
  return <PronunciationDrill rules={pronunciationRules} />;
}
