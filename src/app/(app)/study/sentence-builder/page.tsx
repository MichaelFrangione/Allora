import { sentences } from "@/lib/content";
import SentenceBuilder from "./SentenceBuilder";

export default function SentenceBuilderPage() {
  return <SentenceBuilder exercises={sentences} />;
}
