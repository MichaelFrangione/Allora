import { vocab } from "@/lib/content";
import VocabQuiz from "./VocabQuiz";

export default function VocabStudyPage() {
  return <VocabQuiz items={vocab} />;
}
