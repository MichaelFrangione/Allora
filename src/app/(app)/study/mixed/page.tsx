import { vocab, sentences, conjugations } from "@/lib/content";
import MixedDrill from "./MixedDrill";

export default function MixedPage() {
  return <MixedDrill vocab={vocab} sentences={sentences} conjugations={conjugations} />;
}
