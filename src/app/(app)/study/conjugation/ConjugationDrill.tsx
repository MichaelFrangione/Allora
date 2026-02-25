"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudySession } from "@/lib/useStudySession";
import type { Conjugation } from "@/lib/content";
import { cn } from "@/lib/utils";

const PRONOUNS = ["io", "tu", "lui/lei", "noi", "voi", "loro"];

export default function ConjugationDrill({
  conjugations,
  verbs,
  tenses,
}: {
  conjugations: Conjugation[];
  verbs: string[];
  tenses: string[];
}) {
  const [selectedVerb, setSelectedVerb] = useState(verbs[0] ?? "");
  const [selectedTense, setSelectedTense] = useState(tenses[0] ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean> | null>(null);
  const { startSession, endSession, recordAttempt } = useStudySession("conjugation");

  const conj = conjugations.find(
    (c) => c.verb === selectedVerb && c.tense === selectedTense
  );

  function handleReset() {
    setAnswers({});
    setResults(null);
  }

  async function handleCheck() {
    if (!conj) return;
    await startSession();
    const newResults: Record<string, boolean> = {};
    for (const pronoun of PRONOUNS) {
      const expected = conj.forms[pronoun] ?? "";
      const given = (answers[pronoun] ?? "").trim().toLowerCase();
      const correct = given === expected.toLowerCase();
      newResults[pronoun] = correct;
      await recordAttempt(conj.id, "conjugation", correct, given);
    }
    await endSession();
    setResults(newResults);
  }

  const allCorrect = results && Object.values(results).every(Boolean);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <h1 className="text-2xl font-bold">Conjugation Drill</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Verb</Label>
          <Select value={selectedVerb} onValueChange={(v) => { setSelectedVerb(v); handleReset(); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select verb" />
            </SelectTrigger>
            <SelectContent>
              {verbs.map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tense</Label>
          <Select value={selectedTense} onValueChange={(v) => { setSelectedTense(v); handleReset(); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select tense" />
            </SelectTrigger>
            <SelectContent>
              {tenses.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {conj ? (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {conj.verb} <span className="font-normal text-muted-foreground">— {conj.meaning}</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground capitalize">{conj.tense}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {PRONOUNS.map((pronoun) => {
                const correct = results?.[pronoun];
                const expected = conj.forms[pronoun] ?? "";
                return (
                  <div key={pronoun} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-16 shrink-0 text-muted-foreground">
                      {pronoun}
                    </span>
                    <div className="flex-1 relative">
                      <Input
                        value={answers[pronoun] ?? ""}
                        onChange={(e) =>
                          setAnswers((a) => ({ ...a, [pronoun]: e.target.value }))
                        }
                        disabled={!!results}
                        placeholder="…"
                        className={cn(
                          "text-base",
                          results && correct === true && "border-green-500 bg-green-50 dark:bg-green-950",
                          results && correct === false && "border-red-400 bg-red-50 dark:bg-red-950"
                        )}
                      />
                    </div>
                    {results && correct === false && (
                      <span className="text-sm text-green-700 font-semibold w-24 shrink-0">
                        {expected}
                      </span>
                    )}
                    {results && correct === true && (
                      <span className="text-green-600 shrink-0">✓</span>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {!results ? (
            <Button className="w-full h-12" onClick={handleCheck}>
              Check Answers
            </Button>
          ) : (
            <div className="space-y-2">
              {allCorrect ? (
                <p className="text-center font-semibold text-green-600">
                  Perfect! All correct 🎉
                </p>
              ) : (
                <p className="text-center text-muted-foreground text-sm">
                  {Object.values(results).filter(Boolean).length} / {PRONOUNS.length} correct
                </p>
              )}
              <Button variant="outline" className="w-full" onClick={handleReset}>
                Try Again
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No conjugation found for {selectedVerb} — {selectedTense}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
