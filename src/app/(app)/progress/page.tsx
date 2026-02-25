import { auth } from "@/lib/auth";
import { getModeStats, getWeakItems } from "@/lib/progress";
import { vocab, flashcards, conjugations, grammar, sentences } from "@/lib/content";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type ContentType = "vocab" | "flashcard" | "conjugation" | "grammar" | "sentence";

function getLabel(contentId: string, contentType: ContentType): string {
  switch (contentType) {
    case "vocab": return vocab.find((v) => v.id === contentId)?.italian ?? contentId;
    case "flashcard": return flashcards.find((f) => f.id === contentId)?.front ?? contentId;
    case "conjugation": {
      const c = conjugations.find((c) => c.id === contentId);
      return c ? `${c.verb} (${c.tense})` : contentId;
    }
    case "grammar": return grammar.find((g) => g.id === contentId)?.rule ?? contentId;
    case "sentence": return sentences.find((s) => s.id === contentId)?.english ?? contentId;
    default: return contentId;
  }
}

const MODE_LINKS: Record<string, string> = {
  vocab: "/study/vocab",
  flashcard: "/study/flashcards",
  conjugation: "/study/conjugation",
  grammar: "/study/grammar",
  sentence: "/study/sentence-builder",
};

const MODE_LABELS: Record<string, string> = {
  vocab: "Vocab Quiz",
  flashcard: "Flashcards",
  conjugation: "Conjugation",
  grammar: "Grammar",
  sentence: "Sentences",
};

export default async function ProgressPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [modeStats, weakItems] = await Promise.all([
    getModeStats(userId),
    getWeakItems(userId),
  ]);

  const totalAttempts = modeStats.reduce((sum, m) => sum + m.total, 0);

  // Group weak items by content type
  const weakByType = weakItems.reduce(
    (acc, item) => {
      const type = item.contentType as ContentType;
      if (!acc[type]) acc[type] = [];
      acc[type].push(item);
      return acc;
    },
    {} as Record<ContentType, typeof weakItems>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Progress</h1>

      {totalAttempts === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-muted-foreground text-sm">
              No attempts recorded yet. Start studying to see your progress!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mode accuracy bars */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Accuracy by Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {modeStats.map((m) => (
                <div key={m.mode}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">{MODE_LABELS[m.mode] ?? m.mode}</span>
                    <span className="text-muted-foreground">
                      {Math.round(m.accuracy * 100)}% ({m.total} attempts)
                    </span>
                  </div>
                  <Progress
                    value={m.accuracy * 100}
                    className={`h-2 ${m.accuracy < 0.7 ? "[&>div]:bg-red-500" : ""}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Weak items */}
          {weakItems.length === 0 ? (
            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-green-700 dark:text-green-300 font-medium">
                  🎉 No weak items — keep it up!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Items with ≥3 attempts and &lt;70% accuracy will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Weak Items</h2>
                <Badge variant="destructive">{weakItems.length}</Badge>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Items with ≥3 attempts and &lt;70% accuracy
              </p>

              {Object.entries(weakByType).map(([type, items]) => (
                <Card key={type}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        {MODE_LABELS[type] ?? type}
                      </CardTitle>
                      {MODE_LINKS[type] && (
                        <Link href={MODE_LINKS[type]}>
                          <Button size="sm" variant="outline" className="text-xs h-7">
                            Drill →
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {items
                      .sort((a, b) => a.accuracy - b.accuracy)
                      .map((item) => (
                        <div
                          key={item.contentId}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground truncate flex-1 mr-2">
                            {getLabel(item.contentId, type as ContentType)}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`font-semibold ${
                                item.accuracy < 0.5 ? "text-red-600" : "text-orange-500"
                              }`}
                            >
                              {Math.round(item.accuracy * 100)}%
                            </span>
                            <span className="text-muted-foreground text-xs">
                              ({item.total})
                            </span>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
