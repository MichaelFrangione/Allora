"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStudySession } from "@/lib/useStudySession";
import type { Conjugation } from "@/lib/content";
import { cn } from "@/lib/utils";

const PRONOUNS = ["io", "tu", "lui/lei", "noi", "voi", "loro"];

const IRREGULAR = ["essere","avere","fare","andare","stare","venire","dire","potere","volere","sapere"];

function getVerbType(verb: string): string {
  if (IRREGULAR.includes(verb)) return "irregular";
  if (verb.endsWith("are")) return "-ARE";
  if (verb.endsWith("ere")) return "-ERE";
  if (verb.endsWith("ire")) return "-IRE";
  return "irregular";
}

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
  const [started, setStarted] = useState(false);
  const [pronounList, setPronounList] = useState<string[]>([]);
  const [pronounIndex, setPronounIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [wrongPronouns, setWrongPronouns] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const { startSession, endSession, recordAttempt } = useStudySession("conjugation");

  const conj = conjugations.find(
    (c) => c.verb === selectedVerb && c.tense === selectedTense
  );

  function beginDrill(filterPronouns?: string[]) {
    if (!conj) return;
    const pList = filterPronouns ?? PRONOUNS;
    setPronounList(pList);
    setPronounIndex(0);
    setAnswer("");
    setChecked(false);
    setIsCorrect(false);
    setScore({ correct: 0, incorrect: 0 });
    setWrongPronouns([]);
    setDone(false);
    setStarted(true);
    startSession();
  }

  function exitSession() {
    endSession();
    setStarted(false);
    setDone(false);
  }

  async function handleCheck() {
    if (!conj) return;
    const pronoun = pronounList[pronounIndex];
    const expected = conj.forms[pronoun] ?? "";
    const correct = answer.trim().toLowerCase() === expected.toLowerCase();
    setIsCorrect(correct);
    setChecked(true);
    await recordAttempt(conj.id, "conjugation", correct, answer);
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      incorrect: s.incorrect + (correct ? 0 : 1),
    }));
    if (!correct) setWrongPronouns((p) => [...p, pronoun]);
  }

  async function handleNext() {
    const next = pronounIndex + 1;
    if (next >= pronounList.length) {
      await endSession();
      setDone(true);
    } else {
      setPronounIndex(next);
      setAnswer("");
      setChecked(false);
      setIsCorrect(false);
    }
  }

  // Setup screen
  if (!started) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <h1 className="text-2xl font-bold">Conjugation Drill</h1>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Verb</Label>
            <Select value={selectedVerb} onValueChange={setSelectedVerb}>
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
            <Select value={selectedTense} onValueChange={setSelectedTense}>
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
          <Button className="w-full h-12" onClick={() => beginDrill()}>
            Start · {PRONOUNS.length} forms
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            No conjugation found for {selectedVerb} — {selectedTense}
          </p>
        )}
      </div>
    );
  }

  // Done screen
  if (done) {
    const total = pronounList.length;
    const pct = Math.round((score.correct / total) * 100);
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6">
        <div className="text-5xl">{pct >= 70 ? "🎉" : "📚"}</div>
        <h1 className="text-2xl font-bold">Done!</h1>
        <p className="text-4xl font-bold">{pct}%</p>
        <p className="text-muted-foreground">{score.correct} / {total} correct</p>
        <Button onClick={() => beginDrill()} className="w-full max-w-xs">Try Again</Button>
        {wrongPronouns.length > 0 && (
          <Button
            variant="outline"
            onClick={() => beginDrill(wrongPronouns)}
            className="w-full max-w-xs border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
          >
            Practice {wrongPronouns.length} missed
          </Button>
        )}
        <Button variant="outline" onClick={() => setStarted(false)} className="w-full max-w-xs">
          Change Verb
        </Button>
      </div>
    );
  }

  if (!conj) return null;

  const pronoun = pronounList[pronounIndex];
  const expected = conj.forms[pronoun] ?? "";
  const verbType = getVerbType(conj.verb);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold">{conj.verb}</span>
          <span className="text-muted-foreground text-sm">· {conj.meaning}</span>
          <span className="text-muted-foreground text-sm">· {conj.tense}</span>
          <Badge variant="secondary" className="text-xs">{verbType}</Badge>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-muted-foreground">
            {pronounIndex + 1} / {pronounList.length}
          </span>
          <button
            onClick={exitSession}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
            aria-label="Exit session"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Pronoun prompt */}
      <div className="rounded-2xl border-2 border-border bg-card p-8 text-center">
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-semibold">
          Conjugate
        </p>
        <p className="text-3xl font-bold">{pronoun}</p>
        <p className="text-muted-foreground mt-1">{conj.verb}</p>
      </div>

      {/* Answer input */}
      <div>
        <Input
          value={answer}
          onChange={(e) => { if (!checked) setAnswer(e.target.value); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (!checked) handleCheck();
              else handleNext();
            }
          }}
          placeholder="Type the conjugated form…"
          className={cn(
            "text-base h-12",
            checked && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950",
            checked && !isCorrect && "border-red-400 bg-red-50 dark:bg-red-950"
          )}
          disabled={checked}
          autoFocus
        />
        {checked && !isCorrect && (
          <p className="mt-2 text-sm">
            <span className="text-muted-foreground">Correct: </span>
            <span className="font-semibold text-green-700">{expected}</span>
          </p>
        )}
        {checked && isCorrect && (
          <p className="mt-2 text-sm text-green-600 font-medium">Correct! ✓</p>
        )}
      </div>

      <div className="flex gap-3">
        {!checked ? (
          <Button className="flex-1 h-12" onClick={handleCheck} disabled={!answer.trim()}>
            Check
          </Button>
        ) : (
          <Button className="flex-1 h-12" onClick={handleNext}>
            {pronounIndex + 1 >= pronounList.length ? "See Results" : "Next →"}
          </Button>
        )}
      </div>

      <div className="flex justify-between text-sm px-1">
        <span className="text-green-600 font-medium">✓ {score.correct}</span>
        <span className="text-red-500 font-medium">✗ {score.incorrect}</span>
      </div>
    </div>
  );
}
