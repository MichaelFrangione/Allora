import { vocab } from "@/lib/content";
import MatchGame from "./MatchGame";

export default function MatchPage() {
  return <MatchGame items={vocab} />;
}
