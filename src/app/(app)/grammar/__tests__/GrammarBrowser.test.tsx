// @vitest-environment jsdom
import { afterEach, describe, it, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { TopicContent, PassatoProssimoSection } from "../GrammarBrowser";
import { getTopic } from "../topics";
import { grammar, conjugations } from "@/lib/content";

afterEach(cleanup);

describe("Guide topic page — Passato Prossimo", () => {
  it("TopicContent renders the Passato Prossimo reference (full conjugations, avere/essere)", () => {
    const topic = getTopic("passato-prossimo");
    expect(topic).toBeTruthy();
    render(<TopicContent topic={topic!} rules={grammar} conjugations={conjugations} />);

    // Avere: invariable participle; Essere: agreeing participle.
    expect(screen.getByText("ho mangiato")).toBeTruthy();
    expect(screen.getByText("sono andato/a")).toBeTruthy();
    expect(screen.getByText("siamo andati/e")).toBeTruthy();
    // Regular endings + an irregular participle.
    expect(screen.getAllByText(/-ato/).length).toBeGreaterThan(0);
    expect(screen.getByText("fatto")).toBeTruthy();
  });

  it("PassatoProssimoSection renders standalone", () => {
    render(<PassatoProssimoSection />);
    expect(screen.getByText("hanno mangiato")).toBeTruthy();
  });
});
