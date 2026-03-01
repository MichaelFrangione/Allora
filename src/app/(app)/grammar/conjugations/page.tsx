import { conjugations } from "@/lib/content";
import ConjugationReference from "./ConjugationReference";

export default function ConjugationsPage() {
  return <ConjugationReference conjugations={conjugations} />;
}
