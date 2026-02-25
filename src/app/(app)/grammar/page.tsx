import { grammar, getGrammarTags } from "@/lib/content";
import GrammarBrowser from "./GrammarBrowser";

export default function GrammarPage() {
  const tags = getGrammarTags();
  return <GrammarBrowser initialRules={grammar} tags={tags} />;
}
