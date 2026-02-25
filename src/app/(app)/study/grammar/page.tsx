import { grammar } from "@/lib/content";
import GrammarQuiz from "./GrammarQuiz";

export default function GrammarStudyPage() {
  return <GrammarQuiz rules={grammar} />;
}
