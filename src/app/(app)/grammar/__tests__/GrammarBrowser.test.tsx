// @vitest-environment jsdom
import { afterEach, describe, it, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ReferenceBrowser, { PassatoProssimoSection } from "../GrammarBrowser";
import { grammar, conjugations } from "@/lib/content";

// Radix Accordion may reference ResizeObserver, which jsdom doesn't provide.
globalThis.ResizeObserver =
  globalThis.ResizeObserver ||
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

afterEach(cleanup);

describe("Grammar guide — Passato Prossimo", () => {
  it("is wired into the guide as its own section", () => {
    render(<ReferenceBrowser rules={grammar} conjugations={conjugations} />);
    expect(screen.getByText(/Passato Prossimo — Avere & Essere/)).toBeTruthy();
  });

  it("shows full conjugations and the avere / essere split", () => {
    render(<PassatoProssimoSection />);

    // Avere: invariable participle.
    expect(screen.getByText("ho mangiato")).toBeTruthy();
    expect(screen.getByText("hanno mangiato")).toBeTruthy();

    // Essere: participle agrees with the subject.
    expect(screen.getByText("sono andato/a")).toBeTruthy();
    expect(screen.getByText("siamo andati/e")).toBeTruthy();

    // Regular endings + an irregular participle from the notes.
    expect(screen.getAllByText(/-ato/).length).toBeGreaterThan(0);
    expect(screen.getByText("fatto")).toBeTruthy();
  });
});
