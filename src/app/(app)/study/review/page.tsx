import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDueVocabIds } from "@/lib/progress";
import { getVocabById } from "@/lib/content";
import { Button } from "@/components/ui/button";
import type { VocabItem } from "@/lib/content";
import FlashcardSession from "../flashcards/FlashcardSession";

export default async function ReviewPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const due = userId ? await getDueVocabIds(userId) : [];

  // Map due contentIds to vocab items, most-overdue first; skip any that no longer exist.
  const dueItems = due
    .map((d) => getVocabById(d.contentId))
    .filter((v): v is VocabItem => v !== undefined);

  if (dueItems.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="text-2xl font-bold">All caught up</h1>
        <p className="text-muted-foreground text-sm">
          Nothing is due for review right now. Keep studying and items will resurface here on a
          spaced-repetition schedule.
        </p>
        <Link href="/study/flashcards" className="w-full max-w-xs">
          <Button className="w-full">Study flip cards</Button>
        </Link>
        <Link href="/dashboard" className="w-full max-w-xs">
          <Button variant="outline" className="w-full">
            Back to dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return <FlashcardSession vocab={dueItems} />;
}
