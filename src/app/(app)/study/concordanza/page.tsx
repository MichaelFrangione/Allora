import { concordanza } from "@/lib/content";
import ConcordanzaQuiz from "./ConcordanzaQuiz";

export default function ConcordanzaPage() {
  return <ConcordanzaQuiz questions={concordanza} />;
}
