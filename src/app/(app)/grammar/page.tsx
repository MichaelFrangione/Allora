import { grammar, conjugations } from "@/lib/content";
import ReferenceBrowser from "./GrammarBrowser";

export default function GrammarPage() {
  return <ReferenceBrowser rules={grammar} conjugations={conjugations} />;
}
