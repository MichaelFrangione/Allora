import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { SUBJECTS, getVocabById } from "@/lib/content";
import { DRILL_CONTENT_TYPE_SUBJECT, LEARN_PATH } from "@/lib/drills";

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

// ── Per-user caching ───────────────────────────────────────────────────────────
// The attempt-history scans below (learn stats, due list, mistakes) are cached
// per user and invalidated by revalidateTag(progressTag(userId)) whenever an
// attempt or session is written. The short revalidate window keeps
// time-dependent values (streak, due counts) from drifting too far between
// writes. NOTE: CardAttempt has no DB index yet — @@index([userId, createdAt])
// is worth a deliberate Neon migration if history grows large.

/** Cache tag covering everything derived from a user's attempt history. */
export function progressTag(userId: string): string {
  return `progress-${userId}`;
}

function cached<T>(userId: string, key: string, fn: () => Promise<T>): Promise<T> {
  return unstable_cache(fn, [key, userId], {
    tags: [progressTag(userId)],
    revalidate: 120,
  })();
}

// ── Item / mode accuracy (SQL aggregates — no row transfer) ────────────────────

export async function getUserItemStats(
  userId: string,
  contentType?: string
): Promise<ItemStats[]> {
  const where = { userId, ...(contentType ? { contentType } : {}) };
  const [totals, corrects] = await Promise.all([
    prisma.cardAttempt.groupBy({
      by: ["contentType", "contentId"],
      where,
      _count: { _all: true },
    }),
    prisma.cardAttempt.groupBy({
      by: ["contentType", "contentId"],
      where: { ...where, correct: true },
      _count: { _all: true },
    }),
  ]);

  const correctByKey = new Map(
    corrects.map((c) => [`${c.contentType}::${c.contentId}`, c._count._all])
  );

  return totals
    .map((t) => {
      const correct = correctByKey.get(`${t.contentType}::${t.contentId}`) ?? 0;
      return {
        contentId: t.contentId,
        contentType: t.contentType,
        total: t._count._all,
        correct,
        accuracy: t._count._all > 0 ? correct / t._count._all : 0,
      };
    })
    .filter((s) => s.total >= 3);
}

export async function getWeakItems(
  userId: string,
  contentType?: string,
  threshold = 0.7
): Promise<ItemStats[]> {
  const stats = await getUserItemStats(userId, contentType);
  return stats.filter((s) => s.accuracy < threshold);
}

export async function getModeStats(userId: string): Promise<ModeStats[]> {
  const attemptWhere = { userId, sessionId: { not: null } };
  const [sessions, totals, corrects] = await Promise.all([
    prisma.studySession.findMany({ where: { userId }, select: { id: true, mode: true } }),
    prisma.cardAttempt.groupBy({ by: ["sessionId"], where: attemptWhere, _count: { _all: true } }),
    prisma.cardAttempt.groupBy({
      by: ["sessionId"],
      where: { ...attemptWhere, correct: true },
      _count: { _all: true },
    }),
  ]);

  const modeBySession = new Map(sessions.map((s) => [s.id, s.mode]));
  const modeMap = new Map<string, { total: number; correct: number }>();
  for (const s of sessions) {
    if (!modeMap.has(s.mode)) modeMap.set(s.mode, { total: 0, correct: 0 });
  }
  for (const t of totals) {
    const mode = modeBySession.get(t.sessionId!);
    if (mode) modeMap.get(mode)!.total += t._count._all;
  }
  for (const c of corrects) {
    const mode = modeBySession.get(c.sessionId!);
    if (mode) modeMap.get(mode)!.correct += c._count._all;
  }

  return Array.from(modeMap.entries()).map(([mode, stats]) => ({
    mode,
    total: stats.total,
    correct: stats.correct,
    accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
  }));
}

// ── Spaced repetition (Leitner) ────────────────────────────────────────────────

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

/** Pure Leitner due-list computation, exported for tests. */
export function computeDueItems(
  attempts: { contentId: string; correct: boolean; createdAt: Date }[],
  now: Date
): DueItem[] {
  // contentId → chronologically-ordered attempts (callers sort ascending)
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

async function fetchDueVocabIds(userId: string, now: Date): Promise<DueItem[]> {
  const attempts = await prisma.cardAttempt.findMany({
    where: { userId, contentType: { in: [...DUE_CONTENT_TYPES] } },
    select: { contentId: true, correct: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return computeDueItems(attempts, now);
}

/**
 * Spaced-repetition due list computed from existing CardAttempt rows (no schema
 * change). For each vocab/flashcard contentId: take its attempts in chronological
 * order, find the trailing run of correct answers, map that streak to a Leitner
 * interval, and mark the item due when now >= lastAttempt + interval. Returns
 * most-overdue first. Passing `now` (tests) bypasses the cache.
 */
export async function getDueVocabIds(userId: string, now?: Date): Promise<DueItem[]> {
  if (now) {
    const items = await fetchDueVocabIds(userId, now);
    return items;
  }
  const items = await cached(userId, "due-vocab", () => fetchDueVocabIds(userId, new Date()));
  // unstable_cache round-trips through JSON; shape here is already plain data.
  return items;
}

export async function getDueVocabCount(userId: string, now?: Date): Promise<number> {
  const due = await getDueVocabIds(userId, now);
  return due.length;
}

// ── Mistakes ───────────────────────────────────────────────────────────────────

export type MistakeItem = { contentId: string; contentType: string; wrong: number };

async function fetchMistakeItems(userId: string): Promise<MistakeItem[]> {
  const attempts = await prisma.cardAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { contentId: true, contentType: true, correct: true },
  });
  const map = new Map<string, { contentId: string; contentType: string; wrong: number; lastCorrect: boolean }>();
  for (const a of attempts) {
    const key = `${a.contentType}::${a.contentId}`;
    const e = map.get(key) ?? { contentId: a.contentId, contentType: a.contentType, wrong: 0, lastCorrect: true };
    e.wrong += a.correct ? 0 : 1;
    e.lastCorrect = a.correct; // attempts are ascending, so this ends on the latest
    map.set(key, e);
  }
  return Array.from(map.values())
    .filter((e) => !e.lastCorrect)
    .sort((a, b) => b.wrong - a.wrong)
    .map(({ contentId, contentType, wrong }) => ({ contentId, contentType, wrong }));
}

/**
 * Items whose MOST RECENT attempt was incorrect — i.e. still unresolved mistakes.
 * Answering one correctly makes its latest attempt correct, so it clears from the list.
 * Ordered by total times missed (most-missed first).
 */
export async function getMistakeItems(userId: string): Promise<MistakeItem[]> {
  return cached(userId, "mistakes", () => fetchMistakeItems(userId));
}

export async function getRecentSessions(userId: string, limit = 5) {
  return prisma.studySession.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: limit,
    include: { _count: { select: { attempts: true } } },
  });
}

// ── Learn path: XP, streak, and per-subject mastery (all derived from CardAttempt) ──

const XP_PER_CORRECT = 10;
const XP_PER_ATTEMPT = 2; // a little XP even for wrong answers, like Duolingo

/**
 * Maps a drill's contentType to the subject id it practises. Registry drills
 * come from drills.ts; only the custom study modes are listed by hand.
 */
const CONTENT_TYPE_SUBJECT: Record<string, string> = {
  ...DRILL_CONTENT_TYPE_SUBJECT,
  conjugation: "present-tense",
  descrizione: "descrizione",
  time: "time",
};

type AttemptRow = { contentType: string; contentId: string; correct: boolean; createdAt: Date };

/** Resolve which subject an attempt belongs to (drills by type; vocab/flashcards by their item's tags). */
function subjectForAttempt(a: AttemptRow): string | null {
  const direct = CONTENT_TYPE_SUBJECT[a.contentType];
  if (direct) return direct;
  if (a.contentType === "vocab" || a.contentType === "flashcard") {
    const item = getVocabById(a.contentId);
    if (item) {
      const subject = SUBJECTS.find((s) => s.tags.some((t) => item.tags.includes(t)));
      return subject?.id ?? null;
    }
  }
  return null;
}

/** Local YYYY-MM-DD key for streak grouping. */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Consecutive days practised, counting back from today (stays alive if today not done yet). */
export function computeStreak(dayKeys: Set<string>, now: Date): number {
  if (dayKeys.size === 0) return 0;
  const cursor = new Date(now);
  // If nothing today, start counting from yesterday so the streak isn't broken mid-day.
  if (!dayKeys.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (dayKeys.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Mastery level 0–5 for a subject, from correct count gated by accuracy. */
export function masteryLevel(correct: number, accuracy: number): number {
  if (correct < 4 || accuracy < 0.5) return Math.min(1, Math.floor(correct / 4));
  // 1 level per ~8 correct answers, capped at 5
  return Math.min(5, 1 + Math.floor(correct / 8));
}

export type SubjectProgress = {
  attempts: number;
  correct: number;
  accuracy: number;
  level: number;
};

export const DAILY_GOAL_XP = 30;

export type LearnStats = {
  xp: number;
  streak: number;
  todayCorrect: number;
  todayXp: number;
  totalCorrect: number;
  bySubject: Record<string, SubjectProgress>;
};

async function fetchLearnStats(userId: string, now: Date): Promise<LearnStats> {
  const attempts: AttemptRow[] = await prisma.cardAttempt.findMany({
    where: { userId },
    select: { contentType: true, contentId: true, correct: true, createdAt: true },
  });

  const totalCorrect = attempts.filter((a) => a.correct).length;
  const xp = totalCorrect * XP_PER_CORRECT + (attempts.length - totalCorrect) * XP_PER_ATTEMPT;

  const dayKeys = new Set(attempts.map((a) => dayKey(a.createdAt)));
  const streak = computeStreak(dayKeys, now);

  const todayKey = dayKey(now);
  const todayAttempts = attempts.filter((a) => dayKey(a.createdAt) === todayKey);
  const todayCorrect = todayAttempts.filter((a) => a.correct).length;
  const todayXp = todayCorrect * XP_PER_CORRECT + (todayAttempts.length - todayCorrect) * XP_PER_ATTEMPT;

  const bySubject: Record<string, SubjectProgress> = {};
  for (const a of attempts) {
    const subject = subjectForAttempt(a);
    if (!subject) continue;
    const e = bySubject[subject] ?? { attempts: 0, correct: 0, accuracy: 0, level: 0 };
    e.attempts += 1;
    e.correct += a.correct ? 1 : 0;
    bySubject[subject] = e;
  }
  for (const key of Object.keys(bySubject)) {
    const e = bySubject[key];
    e.accuracy = e.attempts > 0 ? e.correct / e.attempts : 0;
    e.level = masteryLevel(e.correct, e.accuracy);
  }

  return { xp, streak, todayCorrect, todayXp, totalCorrect, bySubject };
}

/**
 * Everything the Duolingo-style Learn path needs, computed from persisted
 * CardAttempt rows (no extra schema). XP, streak and per-subject mastery all
 * survive across devices. Passing `now` (tests) bypasses the cache.
 */
export async function getLearnStats(userId: string, now?: Date): Promise<LearnStats> {
  if (now) return fetchLearnStats(userId, now);
  return cached(userId, "learn-stats", () => fetchLearnStats(userId, new Date()));
}

// ── "Continue" recommendation ──────────────────────────────────────────────────

export type NextUp = { href: string; title: string; detail: string; emoji: string };

/** Pure priority logic behind the Continue CTA, exported for tests. */
export function pickNextUp(input: {
  dueCount: number;
  mistakeCount: number;
  bySubject: Record<string, SubjectProgress>;
}): NextUp {
  const { dueCount, mistakeCount, bySubject } = input;
  if (dueCount > 0) {
    return {
      href: "/study/review",
      title: "Review",
      detail: `${dueCount} item${dueCount === 1 ? "" : "s"} due`,
      emoji: "🔁",
    };
  }
  if (mistakeCount >= 3) {
    return {
      href: "/study/mistakes",
      title: "Fix your mistakes",
      detail: `${mistakeCount} to clear`,
      emoji: "🩹",
    };
  }

  const subjectById = new Map(SUBJECTS.map((s) => [s.id, s]));

  // Weakest in-progress topic on the Learn path…
  const inProgress = LEARN_PATH
    .map((p) => ({ ...p, prog: bySubject[p.subjectId] }))
    .filter((p) => p.prog && p.prog.attempts > 0 && p.prog.level < 5);
  if (inProgress.length > 0) {
    const weakest = inProgress.reduce((a, b) =>
      b.prog!.level < a.prog!.level ||
      (b.prog!.level === a.prog!.level && b.prog!.accuracy < a.prog!.accuracy)
        ? b
        : a
    );
    const subject = subjectById.get(weakest.subjectId);
    return {
      href: weakest.route,
      title: `Level up ${subject?.label ?? weakest.subjectId}`,
      detail: `Level ${weakest.prog!.level} of 5`,
      emoji: subject?.emoji ?? "📈",
    };
  }

  // …or the next new topic on the path.
  const nextNew = LEARN_PATH.find((p) => (bySubject[p.subjectId]?.attempts ?? 0) === 0);
  if (nextNew) {
    const subject = subjectById.get(nextNew.subjectId);
    return {
      href: nextNew.route,
      title: `Start ${subject?.label ?? nextNew.subjectId}`,
      detail: "New topic",
      emoji: subject?.emoji ?? "✨",
    };
  }

  return { href: "/study/mixed", title: "Daily mix", detail: "Keep your streak alive", emoji: "🎲" };
}

/**
 * What the user should do next, one tap: due reviews → unresolved mistakes →
 * weakest in-progress Learn-path topic → next new topic → mixed practice.
 */
export async function getNextUp(userId: string): Promise<NextUp> {
  const [dueCount, mistakes, learn] = await Promise.all([
    getDueVocabCount(userId),
    getMistakeItems(userId),
    getLearnStats(userId),
  ]);
  return pickNextUp({
    dueCount,
    mistakeCount: mistakes.length,
    bySubject: learn.bySubject,
  });
}
