import { describe, it, expect } from "vitest";
import { DRILLS, getDrill, DRILL_QUESTIONS_BY_TYPE, DRILL_CONTENT_TYPE_SUBJECT, LEARN_PATH } from "@/lib/drills";
import { SUBJECTS } from "@/lib/content";

const subjectIds = new Set(SUBJECTS.map((s) => s.id));

describe("drill registry", () => {
  it("has unique slugs and contentTypes", () => {
    const slugs = DRILLS.map((d) => d.slug);
    const types = DRILLS.map((d) => d.contentType);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(types).size).toBe(types.length);
  });

  it("every drill has questions with the shape DrillQuiz needs", () => {
    for (const d of DRILLS) {
      expect(d.questions.length, d.slug).toBeGreaterThan(0);
      for (const q of d.questions) {
        expect(q.id, `${d.slug} question id`).toBeTruthy();
        expect(q.sentence, `${d.slug}/${q.id} sentence`).toBeTruthy();
        expect(q.options, `${d.slug}/${q.id} options`).toContain(q.correct);
      }
    }
  });

  it("question ids are unique within each drill", () => {
    for (const d of DRILLS) {
      const ids = d.questions.map((q) => q.id);
      expect(new Set(ids).size, d.slug).toBe(ids.length);
    }
  });

  it("subjectIds reference real subjects", () => {
    for (const d of DRILLS) {
      if (d.subjectId) expect(subjectIds.has(d.subjectId), `${d.slug} → ${d.subjectId}`).toBe(true);
    }
  });

  it("getDrill resolves every slug and rejects unknowns", () => {
    for (const d of DRILLS) expect(getDrill(d.slug)).toBe(d);
    expect(getDrill("not-a-drill")).toBeUndefined();
  });

  it("derived maps cover every drill", () => {
    for (const d of DRILLS) {
      expect(DRILL_QUESTIONS_BY_TYPE[d.contentType]).toBe(d.questions);
      if (d.subjectId) expect(DRILL_CONTENT_TYPE_SUBJECT[d.contentType]).toBe(d.subjectId);
    }
  });
});

describe("passato prossimo verb cue", () => {
  const pp = DRILL_QUESTIONS_BY_TYPE["passato-prossimo"] ?? [];

  it("has questions", () => {
    expect(pp.length).toBeGreaterThan(0);
  });

  // "forma" (write the full compound) and "participio" (write the past participle)
  // blank out the verb, so the sentence alone can't tell you which verb to use.
  // Each must reveal it — via a `cue` infinitive, or by naming it in «guillemets»
  // ("Il participio passato di «fare»"). Otherwise the prompt is unanswerable in
  // typed mode. (The "ausiliare" category already shows the participle.)
  it("every forma/participio question reveals which verb to use", () => {
    for (const q of pp) {
      if (q.category !== "forma" && q.category !== "participio") continue;
      if (q.sentence.includes("«")) continue; // verb named in the sentence
      expect(q.cue, `${q.id}: ${q.sentence}`).toBeTruthy();
    }
  });

  it("ausiliare questions don't need a cue (the participle is in the sentence)", () => {
    const auxWithCue = pp.filter((q) => q.category === "ausiliare" && q.cue);
    expect(auxWithCue, auxWithCue.map((q) => q.id).join(",")).toHaveLength(0);
  });
});

describe("learn path", () => {
  it("subjects exist and routes resolve to a drill slug or a custom study mode", () => {
    const customRoutes = new Set(["/study/conjugation", "/study/time"]);
    for (const p of LEARN_PATH) {
      expect(subjectIds.has(p.subjectId), p.subjectId).toBe(true);
      const slug = p.route.replace("/study/", "");
      const resolves = getDrill(slug) !== undefined || customRoutes.has(p.route);
      expect(resolves, `${p.subjectId} → ${p.route}`).toBe(true);
    }
  });

  it("has no duplicate subjects", () => {
    const ids = LEARN_PATH.map((p) => p.subjectId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
