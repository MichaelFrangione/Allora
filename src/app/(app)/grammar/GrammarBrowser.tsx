"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UnitSelector from "@/components/UnitSelector";
import { getGrammarUnit } from "@/lib/content";
import type { GrammarRule } from "@/lib/content";

export default function GrammarBrowser({
  initialRules,
  tags,
}: {
  initialRules: GrammarRule[];
  tags: string[];
}) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [unit, setUnit] = useState<number | undefined>(undefined);

  const filtered = initialRules.filter((g) => {
    const matchesUnit = !unit || getGrammarUnit(g) === unit;
    const matchesTag = !activeTag || g.tags.includes(activeTag);
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      g.rule.toLowerCase().includes(q) ||
      g.explanation.toLowerCase().includes(q);
    return matchesUnit && matchesTag && matchesQuery;
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">Grammar Notes</h1>

      <UnitSelector value={unit} onChange={setUnit} />

      <Input
        placeholder="Search rules…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="text-base"
      />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTag("")}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            !activeTag
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border hover:bg-accent"
          }`}
        >
          All
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(activeTag === tag ? "" : tag)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              activeTag === tag
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-accent"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((rule) => (
          <Card key={rule.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-muted text-muted-foreground">
                      U{getGrammarUnit(rule)}
                    </span>
                  </div>
                  <CardTitle className="text-base">{rule.rule}</CardTitle>
                </div>
                <div className="flex flex-wrap gap-1 justify-end">
                  {rule.tags.slice(0, 3).map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px]">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <p className="text-sm text-muted-foreground">{rule.explanation}</p>
              {rule.examples.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Examples
                  </p>
                  <ul className="space-y-0.5">
                    {rule.examples.map((ex, i) => (
                      <li key={i} className="text-sm italic pl-3 border-l-2 border-muted">
                        {ex}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No rules found.</p>
      )}
    </div>
  );
}
