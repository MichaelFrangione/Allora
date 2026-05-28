import { auth } from "@/lib/auth";
import { getLearnStats } from "@/lib/progress";
import LearnPath from "@/components/LearnPath";

export default async function LearnPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const stats = await getLearnStats(userId);

  return (
    <div>
      <div className="max-w-lg mx-auto px-4 pt-6">
        <h1 className="text-2xl font-bold">
          Impariamo{session?.user?.name ? `, ${session.user.name}` : ""}! 🇮🇹
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Your Italian path</p>
      </div>
      <LearnPath stats={stats} />
    </div>
  );
}
