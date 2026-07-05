// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useQuizEngine, buildSessionPool, DEFAULT_LIMIT } from "@/lib/useQuizEngine";

type Q = { id: string; correct: string };

const POOL: Q[] = [
  { id: "q1", correct: "a" },
  { id: "q2", correct: "b" },
  { id: "q3", correct: "c" },
];

function makeEngine(overrides: Partial<Parameters<typeof useQuizEngine<Q>>[0]> = {}) {
  return renderHook(() =>
    useQuizEngine<Q>({
      mode: "test",
      getId: (q) => q.id,
      autoAdvanceMs: 0, // advance manually in tests
      ...overrides,
    })
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ json: async () => ({ id: "session-1" }) }))
  );
});

describe("useQuizEngine", () => {
  it("begin() deals the deck and starts a session", () => {
    const { result } = makeEngine();
    act(() => result.current.begin(POOL));
    expect(result.current.started).toBe(true);
    expect(result.current.deck).toHaveLength(3);
    expect(result.current.current?.id).toBe("q1");
  });

  it("requeues a missed question at the end of the deck until answered correctly", () => {
    const { result } = makeEngine();
    act(() => result.current.begin(POOL));

    act(() => result.current.submit(false, "x")); // miss q1
    expect(result.current.deck).toHaveLength(4);
    expect(result.current.deck[3]).toEqual({ q: POOL[0], retry: true });

    act(() => result.current.next());
    act(() => result.current.submit(true)); // q2
    act(() => result.current.next());
    act(() => result.current.submit(true)); // q3
    act(() => result.current.next());

    // Back on the requeued q1 — still not done.
    expect(result.current.done).toBe(false);
    expect(result.current.current?.id).toBe("q1");
    expect(result.current.currentIsRetry).toBe(true);

    // Missing it again requeues it again.
    act(() => result.current.submit(false, "y"));
    expect(result.current.deck).toHaveLength(5);
  });

  it("scores first attempts only; retries still earn XP", () => {
    const { result } = makeEngine();
    act(() => result.current.begin(POOL));

    act(() => result.current.submit(false, "x")); // q1 wrong: score 0/1, +2 xp
    act(() => result.current.next());
    act(() => result.current.submit(true)); // q2: 1/1, +10
    act(() => result.current.next());
    act(() => result.current.submit(true)); // q3: 2/1, +10
    act(() => result.current.next());
    act(() => result.current.submit(true)); // q1 retry: score unchanged, +10
    act(() => result.current.next());

    expect(result.current.done).toBe(true);
    expect(result.current.score).toEqual({ correct: 2, incorrect: 1 });
    expect(result.current.xp).toBe(2 + 10 + 10 + 10);
    expect(result.current.wrongIds).toEqual(["q1"]);
  });

  it("finishes when the deck (including requeues) is exhausted", () => {
    const { result } = makeEngine();
    act(() => result.current.begin([POOL[0]]));
    act(() => result.current.submit(true));
    act(() => result.current.next());
    expect(result.current.done).toBe(true);
  });

  it("ignores double submits", () => {
    const { result } = makeEngine();
    act(() => result.current.begin(POOL));
    act(() => result.current.submit(true));
    act(() => result.current.submit(false, "late"));
    expect(result.current.score).toEqual({ correct: 1, incorrect: 0 });
    expect(result.current.deck).toHaveLength(3); // no phantom requeue
  });

  it("records every attempt, retries included", () => {
    const fetchMock = vi.mocked(global.fetch);
    const { result } = makeEngine();
    act(() => result.current.begin([POOL[0]]));
    act(() => result.current.submit(false, "x"));
    act(() => result.current.next());
    act(() => result.current.submit(true, "a"));

    const attemptCalls = fetchMock.mock.calls.filter(([url]) => url === "/api/study/attempts");
    expect(attemptCalls).toHaveLength(2);
    const bodies = attemptCalls.map(([, init]) => JSON.parse(String(init!.body)));
    expect(bodies[0]).toMatchObject({ contentId: "q1", contentType: "test", correct: false });
    expect(bodies[1]).toMatchObject({ contentId: "q1", contentType: "test", correct: true });
  });

  it("can disable requeue", () => {
    const { result } = makeEngine({ requeueWrong: false });
    act(() => result.current.begin(POOL));
    act(() => result.current.submit(false, "x"));
    expect(result.current.deck).toHaveLength(3);
  });
});

describe("buildSessionPool", () => {
  it("caps the deck at the limit", () => {
    const pool = buildSessionPool(POOL, { getId: (q) => q.id, limit: 2, boost: false });
    expect(pool).toHaveLength(2);
  });

  it("returns everything when limit is null", () => {
    const pool = buildSessionPool(POOL, { getId: (q) => q.id, limit: null, boost: false });
    expect(pool).toHaveLength(3);
  });

  it("triples weak items when boost is on", () => {
    const pool = buildSessionPool(POOL, {
      getId: (q) => q.id,
      weakIds: ["q2"],
      limit: null,
      boost: true,
    });
    expect(pool.filter((q) => q.id === "q2")).toHaveLength(3);
    expect(pool).toHaveLength(5);
  });

  it("default session length is 10", () => {
    expect(DEFAULT_LIMIT).toBe(10);
  });
});
