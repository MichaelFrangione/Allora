import { conjugations, getConjugationVerbs, getConjugationTenses } from "@/lib/content";
import ConjugationDrill from "./ConjugationDrill";

export default function ConjugationPage() {
  const verbs = getConjugationVerbs();
  const tenses = getConjugationTenses();
  return <ConjugationDrill conjugations={conjugations} verbs={verbs} tenses={tenses} />;
}
