import { describe, it, expect } from "vitest";
import { townMap } from "@/lib/content";

const placeIds = new Set(townMap.places.map((p) => p.id));

describe("town map data", () => {
  it("has unique place and question ids", () => {
    expect(placeIds.size).toBe(townMap.places.length);
    const qids = townMap.questions.map((q) => q.id);
    expect(new Set(qids).size).toBe(qids.length);
  });

  it("keeps every hotspot inside the image", () => {
    for (const p of townMap.places) {
      const [x, y, w, h] = p.rect;
      expect(x >= 0 && y >= 0 && w > 0 && h > 0, p.id).toBe(true);
      expect(x + w <= townMap.width && y + h <= townMap.height, p.id).toBe(true);
    }
  });

  it("tap questions answer with real places; choice questions have their answer among the options", () => {
    for (const q of townMap.questions) {
      if (q.type === "trova" || q.type === "errand" || q.type === "dove-sei") {
        expect(q.answers?.length, q.id).toBeGreaterThan(0);
        for (const a of q.answers!) expect(placeIds.has(a), `${q.id} → ${a}`).toBe(true);
      } else {
        expect(q.options, q.id).toContain(q.correct);
        expect(new Set(q.options).size, q.id).toBe(q.options!.length);
        expect(q.highlight?.length, q.id).toBeGreaterThan(0);
      }
      for (const id of [...(q.highlight ?? []), ...(q.start ? [q.start] : [])]) {
        expect(placeIds.has(id), `${q.id} → ${id}`).toBe(true);
      }
    }
  });

  it("asks every place in the find round", () => {
    const found = new Set(townMap.questions.filter((q) => q.type === "trova").flatMap((q) => q.answers ?? []));
    expect(found).toEqual(placeIds);
  });
});
