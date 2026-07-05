import { describe, it, expect } from "vitest";
import { normalizeAnswer, isAnswerCorrect, isTypeable } from "@/lib/answer-check";

describe("normalizeAnswer", () => {
  it("lowercases, trims and collapses whitespace", () => {
    expect(normalizeAnswer("  Sono  le Tre ")).toBe("sono le tre");
  });

  it("ignores trailing sentence punctuation", () => {
    expect(normalizeAnswer("È l'una.")).toBe("è l'una");
    expect(normalizeAnswer("Dove vai?!")).toBe("dove vai");
  });

  it("normalizes curly apostrophes", () => {
    expect(normalizeAnswer("l’una")).toBe("l'una");
  });
});

describe("isAnswerCorrect", () => {
  it("accepts case and punctuation variants", () => {
    expect(isAnswerCorrect("sono le tre", "Sono le tre.")).toBe(true);
    expect(isAnswerCorrect("È L’UNA", "è l'una")).toBe(true);
  });

  it("is accent-sensitive (e vs è matters in Italian)", () => {
    expect(isAnswerCorrect("e", "è")).toBe(false);
  });

  it("rejects wrong answers", () => {
    expect(isAnswerCorrect("il", "lo")).toBe(false);
  });
});

describe("isTypeable", () => {
  it("accepts short answers", () => {
    expect(isTypeable("il")).toBe(true);
    expect(isTypeable("mi sveglio")).toBe(true);
  });

  it("rejects long phrases and full sentences", () => {
    expect(isTypeable("Mi piacciono molto gli spaghetti al pomodoro")).toBe(false);
    expect(isTypeable("one two three four")).toBe(false);
  });
});
