import { describe, it, expect } from "vitest";
import {
  conjugatePP,
  agreementForms,
  AVERE_PRESENT,
  ESSERE_PRESENT,
  AVERE_VERBS,
  ESSERE_VERBS,
  IRREGULAR_GROUPS,
  REGULAR_PARTICIPLE,
} from "@/lib/passato-prossimo";

describe("conjugatePP", () => {
  it("avere: present auxiliary + invariable participle", () => {
    expect(conjugatePP({ aux: "avere", participle: "mangiato" })).toEqual([
      "ho mangiato",
      "hai mangiato",
      "ha mangiato",
      "abbiamo mangiato",
      "avete mangiato",
      "hanno mangiato",
    ]);
  });

  it("essere: participle agrees — singular -o/a, plural -i/e", () => {
    expect(conjugatePP({ aux: "essere", participle: "andato" })).toEqual([
      "sono andato/a",
      "sei andato/a",
      "è andato/a",
      "siamo andati/e",
      "siete andati/e",
      "sono andati/e",
    ]);
  });

  it("returns exactly 6 forms for every example verb", () => {
    for (const v of [...AVERE_VERBS, ...ESSERE_VERBS]) {
      expect(conjugatePP(v), v.verb).toHaveLength(6);
    }
  });
});

describe("agreementForms", () => {
  it("derives -o / -a / -i / -e from the masculine participle", () => {
    expect(agreementForms("andato")).toMatchObject({
      mSing: "andato",
      fSing: "andata",
      mPlur: "andati",
      fPlur: "andate",
      singular: "andato/a",
      plural: "andati/e",
    });
  });

  it("works for an irregular essere participle", () => {
    expect(agreementForms("rimasto")).toMatchObject({
      mSing: "rimasto",
      fPlur: "rimaste",
    });
  });
});

describe("reference data integrity", () => {
  it("auxiliary tables have 6 persons", () => {
    expect(AVERE_PRESENT).toHaveLength(6);
    expect(ESSERE_PRESENT).toHaveLength(6);
  });

  it("regular participle covers -are / -ere / -ire", () => {
    expect(REGULAR_PARTICIPLE.map((r) => r.ending)).toEqual(["-are", "-ere", "-ire"]);
  });

  it("example verbs use the auxiliary their group claims", () => {
    for (const v of AVERE_VERBS) expect(v.aux, v.verb).toBe("avere");
    for (const v of ESSERE_VERBS) expect(v.aux, v.verb).toBe("essere");
  });

  it("irregular groups: every pair is [infinitive, participle], no duplicate infinitives", () => {
    const seen = new Set<string>();
    for (const g of IRREGULAR_GROUPS) {
      expect(g.pairs.length, g.ending).toBeGreaterThan(0);
      for (const [inf, part] of g.pairs) {
        expect(inf, `${g.ending} infinitive`).toBeTruthy();
        expect(part, `${inf} participle`).toBeTruthy();
        expect(seen.has(inf), `duplicate infinitive ${inf}`).toBe(false);
        seen.add(inf);
      }
    }
  });
});
