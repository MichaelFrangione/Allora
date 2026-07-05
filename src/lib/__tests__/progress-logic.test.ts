import { describe, it, expect } from "vitest";
import { computeDueItems, computeStreak, masteryLevel, pickNextUp } from "@/lib/progress";
import type { SubjectProgress } from "@/lib/progress";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-07-05T12:00:00");

function attempt(contentId: string, correct: boolean, daysAgo: number) {
  return { contentId, correct, createdAt: new Date(now.getTime() - daysAgo * DAY) };
}

describe("computeDueItems (Leitner)", () => {
  it("an item answered wrong is due immediately", () => {
    const due = computeDueItems([attempt("a", false, 0)], now);
    expect(due.map((d) => d.contentId)).toEqual(["a"]);
  });

  it("a 1-correct streak is not due until a day passes", () => {
    expect(computeDueItems([attempt("a", true, 0.5)], now)).toEqual([]);
    expect(computeDueItems([attempt("a", true, 1.5)], now)).toHaveLength(1);
  });

  it("a 2-correct streak waits 3 days", () => {
    const history = [attempt("a", true, 2.5), attempt("a", true, 2)];
    expect(computeDueItems(history, now)).toEqual([]);
    const older = [attempt("a", true, 4), attempt("a", true, 3.5)];
    expect(computeDueItems(older, now)).toHaveLength(1);
  });

  it("a wrong answer resets the trailing streak", () => {
    // 2 corrects then a miss then 1 correct → streak is 1 → 1-day interval
    const history = [
      attempt("a", true, 5),
      attempt("a", true, 4),
      attempt("a", false, 3),
      attempt("a", true, 0.5),
    ];
    expect(computeDueItems(history, now)).toEqual([]);
  });

  it("orders most-overdue first", () => {
    const due = computeDueItems([attempt("old", false, 10), attempt("new", false, 1)], now);
    expect(due.map((d) => d.contentId)).toEqual(["old", "new"]);
  });
});

describe("computeStreak", () => {
  function key(d: Date) {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }
  function daysAgoKey(n: number) {
    return key(new Date(now.getTime() - n * DAY));
  }

  it("counts consecutive days including today", () => {
    const days = new Set([daysAgoKey(0), daysAgoKey(1), daysAgoKey(2)]);
    expect(computeStreak(days, now)).toBe(3);
  });

  it("stays alive if today has no practice yet", () => {
    const days = new Set([daysAgoKey(1), daysAgoKey(2)]);
    expect(computeStreak(days, now)).toBe(2);
  });

  it("breaks on a gap", () => {
    const days = new Set([daysAgoKey(0), daysAgoKey(2)]);
    expect(computeStreak(days, now)).toBe(1);
  });

  it("is 0 with no practice", () => {
    expect(computeStreak(new Set(), now)).toBe(0);
  });
});

describe("masteryLevel", () => {
  it("needs 4 corrects for level 1", () => {
    expect(masteryLevel(3, 1)).toBe(0);
    expect(masteryLevel(4, 1)).toBe(1);
  });

  it("low accuracy caps at level 1", () => {
    expect(masteryLevel(40, 0.4)).toBe(1);
  });

  it("grows ~1 level per 8 corrects, capped at 5", () => {
    expect(masteryLevel(8, 0.9)).toBe(2);
    expect(masteryLevel(16, 0.9)).toBe(3);
    expect(masteryLevel(100, 0.9)).toBe(5);
  });
});

describe("pickNextUp priority", () => {
  const prog = (attempts: number, correct: number, accuracy: number, level: number): SubjectProgress => ({
    attempts,
    correct,
    accuracy,
    level,
  });

  it("due reviews come first", () => {
    const next = pickNextUp({ dueCount: 4, mistakeCount: 10, bySubject: {} });
    expect(next.href).toBe("/study/review");
  });

  it("then unresolved mistakes (3+)", () => {
    const next = pickNextUp({ dueCount: 0, mistakeCount: 3, bySubject: {} });
    expect(next.href).toBe("/study/mistakes");
  });

  it("then the weakest in-progress topic on the path", () => {
    const next = pickNextUp({
      dueCount: 0,
      mistakeCount: 0,
      bySubject: {
        greetings: prog(20, 18, 0.9, 3),
        articles: prog(10, 6, 0.6, 1),
      },
    });
    expect(next.href).toBe("/study/articoli");
  });

  it("skips mastered topics and offers the next new one when nothing is in progress", () => {
    const next = pickNextUp({
      dueCount: 0,
      mistakeCount: 0,
      bySubject: { greetings: prog(100, 95, 0.95, 5) },
    });
    // greetings mastered → next new topic on the path is essere-avere
    expect(next.href).toBe("/study/essere-avere");
  });

  it("falls back to the daily mix when everything is mastered", () => {
    const bySubject: Record<string, SubjectProgress> = {};
    for (const id of [
      "greetings", "essere-avere", "present-tense", "articles", "gender", "plural",
      "adjectives", "possessives", "piacere", "reflexive-verbs", "modals", "pronouns",
      "prepositions", "interrogatives", "demonstratives", "time", "gerundio", "passato-prossimo",
    ]) {
      bySubject[id] = prog(100, 95, 0.95, 5);
    }
    const next = pickNextUp({ dueCount: 0, mistakeCount: 0, bySubject });
    expect(next.href).toBe("/study/mixed");
  });
});
