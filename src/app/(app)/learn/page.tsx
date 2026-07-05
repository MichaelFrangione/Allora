import { auth } from "@/lib/auth";
import { getLearnStats, getNextUp } from "@/lib/progress";
import LearnPath from "@/components/LearnPath";
import ContinueCard from "@/components/ContinueCard";

export default async function LearnPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const [stats, nextUp] = await Promise.all([getLearnStats(userId), getNextUp(userId)]);

  return (
    <div>
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">
            Impariamo{session?.user?.name ? `, ${session.user.name}` : ""}! 🇮🇹
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Your Italian path</p>
        </div>
        <ContinueCard nextUp={nextUp} />
      </div>
      <LearnPath stats={stats} />
    </div>
  );
}
