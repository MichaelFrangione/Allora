import { describe, it, expect } from "vitest";
import { TOPICS, VISIBLE_TOPICS, getTopic, topicHasContent, exercisesForTopic } from "../topics";

describe("grammar topic registry", () => {
  it("has unique ids", () => {
    const ids = TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getTopic resolves known topics and rejects unknowns", () => {
    expect(getTopic("passato-prossimo")?.extra).toBe("passato-prossimo");
    expect(getTopic("not-a-topic")).toBeUndefined();
  });

  it("VISIBLE_TOPICS only includes topics with content, and includes Passato Prossimo", () => {
    expect(VISIBLE_TOPICS.every(topicHasContent)).toBe(true);
    expect(VISIBLE_TOPICS.some((t) => t.id === "passato-prossimo")).toBe(true);
  });

  it("exercisesForTopic maps a topic to its drills", () => {
    const ex = exercisesForTopic("passato-prossimo");
    expect(ex.map((e) => e.slug)).toContain("passato-prossimo");
    // A topic with no drill returns an empty list (not an error).
    expect(exercisesForTopic("not-a-topic")).toEqual([]);
  });
});
