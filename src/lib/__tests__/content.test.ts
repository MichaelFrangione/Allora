import { describe, it, expect } from "vitest";
import { SUBJECTS, vocab, tagsMatchSubject } from "@/lib/content";
import { LEARN_PATH, getDrill } from "@/lib/drills";

describe("vocab", () => {
  it("has unique ids across every themed file", () => {
    const ids = vocab.map((v) => v.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect([...new Set(dupes)]).toEqual([]);
  });
});

describe("subjects", () => {
  it("has unique ids and owns its own id as a tag", () => {
    const ids = SUBJECTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SUBJECTS) expect(s.tags, s.id).toContain(s.id);
  });

  it("no tag is claimed by two subjects", () => {
    const owner = new Map<string, string>();
    for (const s of SUBJECTS) {
      for (const t of s.tags) {
        expect(owner.get(t), `tag "${t}" claimed by ${owner.get(t)} and ${s.id}`).toBeUndefined();
        owner.set(t, s.id);
      }
    }
  });
});

// Lezione 1 (2026-09-14): body parts, physical description, clothes, patterns.
describe("lezione 1 content", () => {
  const lesson = vocab.filter((v) => v.id.startsWith("l1-"));

  it("is loaded and well-formed", () => {
    expect(lesson.length).toBeGreaterThan(30);
    for (const v of lesson) {
      expect(v.italian, v.id).toBeTruthy();
      expect(v.english, v.id).toBeTruthy();
      expect(v.tags.length, v.id).toBeGreaterThan(0);
      expect(v.pronunciation, v.id).toBeTruthy();
    }
  });

  it("files every item under a real subject", () => {
    for (const v of lesson) {
      const subjects = SUBJECTS.filter((s) => tagsMatchSubject(v.tags, s.id));
      expect(subjects.length, `${v.id} (${v.tags.join(", ")}) matches no subject`).toBeGreaterThan(0);
    }
  });

  it("teaches the body parts that switch gender in the plural", () => {
    const corpo = getDrill("corpo");
    expect(corpo).toBeDefined();
    const answers = corpo!.questions
      .filter((q) => q.category === "plurale-irregolare")
      .map((q) => q.correct);
    for (const plural of ["le labbra", "le sopracciglia", "le ciglia", "le corna", "le orecchie"]) {
      expect(answers, plural).toContain(plural);
    }
  });

  it("puts both new drills on the learn path", () => {
    for (const slug of ["corpo", "indovina-chi"]) {
      const drill = getDrill(slug);
      expect(drill, slug).toBeDefined();
      const step = LEARN_PATH.find((p) => p.route === `/study/${slug}`);
      expect(step, `${slug} missing from LEARN_PATH`).toBeDefined();
      expect(step!.subjectId).toBe(drill!.subjectId);
    }
  });
});
