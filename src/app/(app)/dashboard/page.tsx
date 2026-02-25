import { auth } from "@/lib/auth";
import { getModeStats, getRecentSessions } from "@/lib/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

const studyModes = [
  { href: "/study/flashcards", label: "Flip Cards", emoji: "🃏", desc: "Both directions" },
  { href: "/study/vocab", label: "Vocab Quiz", emoji: "📝", desc: "Multiple choice" },
  { href: "/study/conjugation", label: "Conjugation", emoji: "🔤", desc: "One form at a time" },
  { href: "/study/grammar", label: "Grammar", emoji: "📖", desc: "Rule quiz" },
  { href: "/study/sentence-builder", label: "Sentences", emoji: "🧩", desc: "Tap to build" },
  { href: "/study/mixed", label: "Mixed", emoji: "🎲", desc: "All modes at once" },
];

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [modeStats, recentSessions] = await Promise.all([
    getModeStats(userId),
    getRecentSessions(userId, 3),
  ]);

  const totalAttempts = modeStats.reduce((sum: number, m) => sum + m.total, 0);
  const overallAccuracy =
    totalAttempts > 0
      ? modeStats.reduce((sum: number, m) => sum + m.correct, 0) / totalAttempts
      : null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Ciao{session?.user?.name ? `, ${session.user.name}` : ""}! 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Ready to practice Italian?</p>
      </div>

      {overallAccuracy !== null && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-bold">
                {Math.round(overallAccuracy * 100)}%
              </span>
              <span className="text-sm text-muted-foreground mb-1">
                ({totalAttempts} attempts)
              </span>
            </div>
            <Progress value={overallAccuracy * 100} className="h-2" />
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Quick Start
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {studyModes.map(({ href, label, emoji, desc }) => (
            <Link key={href} href={href}>
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardContent className="pt-4 pb-3 px-3">
                  <div className="text-2xl mb-1">{emoji}</div>
                  <div className="font-semibold text-sm">{label}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {modeStats.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Mode Accuracy
          </h2>
          <Card>
            <CardContent className="pt-4 space-y-3">
              {modeStats.map((m) => (
                <div key={m.mode}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{m.mode}</span>
                    <span className="text-muted-foreground">
                      {Math.round(m.accuracy * 100)}%
                    </span>
                  </div>
                  <Progress value={m.accuracy * 100} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {recentSessions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Recent Sessions
          </h2>
          <div className="space-y-2">
            {recentSessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between text-sm px-3 py-2 rounded-lg border"
              >
                <span className="capitalize font-medium">{s.mode}</span>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>{s._count.attempts} cards</span>
                  <span>{new Date(s.startedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Link href="/progress">
              <Button variant="outline" size="sm" className="w-full">
                View full progress →
              </Button>
            </Link>
          </div>
        </div>
      )}

      {totalAttempts === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center pb-6">
            <p className="text-muted-foreground text-sm">
              No study sessions yet. Pick a mode above to get started!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
