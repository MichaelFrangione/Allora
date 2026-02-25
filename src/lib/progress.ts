import { prisma } from "@/lib/prisma";

export type ItemStats = {
  contentId: string;
  contentType: string;
  total: number;
  correct: number;
  accuracy: number;
};

export type ModeStats = {
  mode: string;
  total: number;
  correct: number;
  accuracy: number;
};

export async function getUserItemStats(userId: string): Promise<ItemStats[]> {
  const attempts = await prisma.cardAttempt.findMany({
    where: { userId },
    select: { contentId: true, contentType: true, correct: true },
  });

  const map = new Map<string, { total: number; correct: number; contentType: string }>();

  for (const a of attempts) {
    const key = `${a.contentType}::${a.contentId}`;
    const existing = map.get(key) ?? { total: 0, correct: 0, contentType: a.contentType };
    existing.total += 1;
    existing.correct += a.correct ? 1 : 0;
    map.set(key, existing);
  }

  return Array.from(map.entries())
    .map(([key, stats]) => {
      const [, contentId] = key.split("::");
      return {
        contentId,
        contentType: stats.contentType,
        total: stats.total,
        correct: stats.correct,
        accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
      };
    })
    .filter((s) => s.total >= 3);
}

export async function getWeakItems(
  userId: string,
  threshold = 0.7
): Promise<ItemStats[]> {
  const stats = await getUserItemStats(userId);
  return stats.filter((s) => s.accuracy < threshold);
}

export async function getModeStats(userId: string): Promise<ModeStats[]> {
  const sessions = await prisma.studySession.findMany({
    where: { userId },
    include: { attempts: { select: { correct: true } } },
  });

  const modeMap = new Map<string, { total: number; correct: number }>();

  for (const session of sessions) {
    const existing = modeMap.get(session.mode) ?? { total: 0, correct: 0 };
    existing.total += session.attempts.length;
    existing.correct += session.attempts.filter((a) => a.correct).length;
    modeMap.set(session.mode, existing);
  }

  return Array.from(modeMap.entries()).map(([mode, stats]) => ({
    mode,
    total: stats.total,
    correct: stats.correct,
    accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
  }));
}

export async function getRecentSessions(userId: string, limit = 5) {
  return prisma.studySession.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: limit,
    include: { _count: { select: { attempts: true } } },
  });
}
