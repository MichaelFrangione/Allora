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

// Leitner box → days until an item is due again, keyed by trailing correct-streak.
const LEITNER_INTERVAL_DAYS: Record<number, number> = { 0: 0, 1: 1, 2: 3, 3: 7, 4: 14 };
const MAX_INTERVAL_DAYS = 30; // streak >= 5

function intervalDaysForStreak(streak: number): number {
  return streak >= 5 ? MAX_INTERVAL_DAYS : LEITNER_INTERVAL_DAYS[streak] ?? 0;
}

const DUE_CONTENT_TYPES = ["flashcard", "vocab"] as const;

export type DueItem = {
  contentId: string;
  /** ms past the due time; higher = more overdue */
  overdueMs: number;
};

/**
 * Spaced-repetition due list computed from existing CardAttempt rows (no schema change).
 * For each vocab/flashcard contentId: take its attempts in chronological order, find the
 * trailing run of correct answers, map that streak to a Leitner interval, and mark the item
 * due when now >= lastAttempt + interval. Returns most-overdue first.
 */
export async function getDueVocabIds(
  userId: string,
  now: Date = new Date()
): Promise<DueItem[]> {
  const attempts = await prisma.cardAttempt.findMany({
    where: { userId, contentType: { in: [...DUE_CONTENT_TYPES] } },
    select: { contentId: true, correct: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // contentId → chronologically-ordered attempts (query already sorts ascending)
  const byContent = new Map<string, { correct: boolean; createdAt: Date }[]>();
  for (const a of attempts) {
    const list = byContent.get(a.contentId) ?? [];
    list.push({ correct: a.correct, createdAt: a.createdAt });
    byContent.set(a.contentId, list);
  }

  const due: DueItem[] = [];
  for (const [contentId, list] of byContent) {
    const last = list[list.length - 1];

    // Trailing correct-streak: count consecutive correct answers from the end.
    let streak = 0;
    for (let i = list.length - 1; i >= 0 && list[i].correct; i--) streak++;

    const intervalMs = intervalDaysForStreak(streak) * 24 * 60 * 60 * 1000;
    const dueAt = last.createdAt.getTime() + intervalMs;
    const overdueMs = now.getTime() - dueAt;
    if (overdueMs >= 0) due.push({ contentId, overdueMs });
  }

  due.sort((a, b) => b.overdueMs - a.overdueMs);
  return due;
}

export async function getDueVocabCount(
  userId: string,
  now: Date = new Date()
): Promise<number> {
  const due = await getDueVocabIds(userId, now);
  return due.length;
}

export async function getRecentSessions(userId: string, limit = 5) {
  return prisma.studySession.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: limit,
    include: { _count: { select: { attempts: true } } },
  });
}
