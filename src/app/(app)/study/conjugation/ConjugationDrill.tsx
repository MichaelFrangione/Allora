"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CircleHelp } from "lucide-react";
import { useStudySession } from "@/lib/useStudySession";
import type { Conjugation } from "@/lib/content";
import { cn } from "@/lib/utils";
import { getBoostEnabled } from "@/components/BoostToggle";

const PRONOUNS = ["io", "tu", "lui/lei", "noi", "voi", "loro"];
const IRREGULAR = ["essere","avere","fare","andare","stare","venire","dire","potere","volere","sapere"];
const LIMIT_OPTIONS = [10, 20, 30, 50, null] as const;

const ISC_VERBS = [
  "capire","finire","preferire","pulire","suggerire","costruire","spedire","sparire",
  "vestire","cucire","dimagrire","arrossire","guarire","obbedire","abolire","proibire",
  "reagire","restituire","impazzire","fallire",
];

function getVerbType(conj: Conjugation): "ARE" | "ERE" | "IRE" | "IRE-ISC" | "irregular" {
  if (IRREGULAR.includes(conj.verb)) return "irregular";
  if (ISC_VERBS.includes(conj.verb) || conj.meaning.includes("-isc-")) return "IRE-ISC";
  if (conj.verb.endsWith("are")) return "ARE";
  if (conj.verb.endsWith("ere")) return "ERE";
  if (conj.verb.endsWith("ire")) return "IRE";
  return "irregular";
}

const CHEAT_SHEETS: Record<string, { title: string; rows: { pronoun: string; ending: string; example: string }[] }> = {
  ARE: {
    title: "-ARE verbs (e.g. parlare)",
    rows: [
      { pronoun: "io", ending: "-o", example: "parlo" },
      { pronoun: "tu", ending: "-i", example: "parli" },
      { pronoun: "lui/lei", ending: "-a", example: "parla" },
      { pronoun: "noi", ending: "-iamo", example: "parliamo" },
      { pronoun: "voi", ending: "-ate", example: "parlate" },
      { pronoun: "loro", ending: "-ano", example: "parlano" },
    ],
  },
  ERE: {
    title: "-ERE verbs (e.g. scrivere)",
    rows: [
      { pronoun: "io", ending: "-o", example: "scrivo" },
      { pronoun: "tu", ending: "-i", example: "scrivi" },
      { pronoun: "lui/lei", ending: "-e", example: "scrive" },
      { pronoun: "noi", ending: "-iamo", example: "scriviamo" },
      { pronoun: "voi", ending: "-ete", example: "scrivete" },
      { pronoun: "loro", ending: "-ono", example: "scrivono" },
    ],
  },
  IRE: {
    title: "-IRE verbs regular (e.g. dormire)",
    rows: [
      { pronoun: "io", ending: "-o", example: "dormo" },
      { pronoun: "tu", ending: "-i", example: "dormi" },
      { pronoun: "lui/lei", ending: "-e", example: "dorme" },
      { pronoun: "noi", ending: "-iamo", example: "dormiamo" },
      { pronoun: "voi", ending: "-ite", example: "dormite" },
      { pronoun: "loro", ending: "-ono", example: "dormono" },
    ],
  },
  "IRE-ISC": {
    title: "-IRE (-isc-) verbs (e.g. preferire)",
    rows: [
      { pronoun: "io", ending: "-isco", example: "preferisco" },
      { pronoun: "tu", ending: "-isci", example: "preferisci" },
      { pronoun: "lui/lei", ending: "-isce", example: "preferisce" },
      { pronoun: "noi", ending: "-iamo", example: "preferiamo" },
      { pronoun: "voi", ending: "-ite", example: "preferite" },
      { pronoun: "loro", ending: "-iscono", example: "preferiscono" },
    ],
  },
  irregular: {
    title: "Key Irregular verbs",
    rows: [
      { pronoun: "essere", ending: "sono/sei/è/siamo/siete/sono", example: "io sono" },
      { pronoun: "avere", ending: "ho/hai/ha/abbiamo/avete/hanno", example: "io ho" },
      { pronoun: "fare", ending: "faccio/fai/fa/facciamo/fate/fanno", example: "io faccio" },
      { pronoun: "andare", ending: "vado/vai/va/andiamo/andate/vanno", example: "io vado" },
      { pronoun: "venire", ending: "vengo/vieni/viene/veniamo/venite/vengono", example: "io vengo" },
      { pronoun: "stare", ending: "sto/stai/sta/stiamo/state/stanno", example: "io sto" },
    ],
  },
};

type DrillMode = "pick" | "random";

type RandomCard = { conj: Conjugation; pronoun: string };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRandomDeck(conjugations: Conjugation[], count: number | null, weakIds: Set<string>): RandomCard[] {
  const pairs: RandomCard[] = [];
  const boostEnabled = getBoostEnabled();
  for (const conj of conjugations) {
    const copies = boostEnabled && weakIds.has(conj.id) ? 3 : 1;
    for (let i = 0; i < copies; i++) {
      for (const pronoun of PRONOUNS) {
        pairs.push({ conj, pronoun });
      }
    }
  }
  const shuffled = shuffle(pairs);
  return count !== null ? shuffled.slice(0, count) : shuffled;
}

export default function ConjugationDrill({
  conjugations,
  verbs,
  tenses,
  weakIds = [],
  initialIds,
}: {
  conjugations: Conjugation[];
  verbs: string[];
  tenses: string[];
  weakIds?: string[];
  initialIds?: string[];
}) {
  const [drillMode, setDrillMode] = useState<DrillMode>("pick");
  const [selectedVerb, setSelectedVerb] = useState(verbs[0] ?? "");
  const [selectedTense, setSelectedTense] = useState(tenses[0] ?? "");
  const [limit, setLimit] = useState<number | null>(30);
  const [started, setStarted] = useState(false);

  // Pick mode state
  const [pronounList, setPronounList] = useState<string[]>([]);
  const [pronounIndex, setPronounIndex] = useState(0);

  // Random mode state
  const [randomDeck, setRandomDeck] = useState<RandomCard[]>([]);
  const [randomIndex, setRandomIndex] = useState(0);

  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [wrongItems, setWrongItems] = useState<Array<string | RandomCard>>([]);
  const [done, setDone] = useState(false);
  const { startSession, endSession, recordAttempt } = useStudySession("conjugation");

  useEffect(() => {
    if (initialIds && initialIds.length > 0) {
      setDrillMode("random");
      const weakConjs = conjugations.filter((c) => initialIds.includes(c.id));
      beginRandomDrill(buildRandomDeck(weakConjs, null, new Set()));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickConj = conjugations.find(
    (c) => c.verb === selectedVerb && c.tense === selectedTense
  );

  // Current card in random mode
  const randomCard = randomDeck[randomIndex];
  const currentConj = drillMode === "random" ? randomCard?.conj : pickConj;
  const currentPronoun = drillMode === "random" ? randomCard?.pronoun : pronounList[pronounIndex];
  const verbType = currentConj ? getVerbType(currentConj) : "ARE";
  const cheatSheet = CHEAT_SHEETS[verbType];

  function beginPickDrill(filterPronouns?: string[]) {
    if (!pickConj) return;
    const pList = filterPronouns ?? PRONOUNS;
    setPronounList(pList);
    setPronounIndex(0);
    setAnswer("");
    setChecked(false);
    setIsCorrect(false);
    setScore({ correct: 0, incorrect: 0 });
    setWrongItems([]);
    setDone(false);
    setStarted(true);
    startSession();
  }

  function beginRandomDrill(filterItems?: RandomCard[]) {
    const deck = filterItems ?? buildRandomDeck(conjugations, limit, new Set(weakIds));
    setRandomDeck(deck);
    setRandomIndex(0);
    setAnswer("");
    setChecked(false);
    setIsCorrect(false);
    setScore({ correct: 0, incorrect: 0 });
    setWrongItems([]);
    setDone(false);
    setStarted(true);
    startSession();
  }

  function exitSession() {
    endSession();
    setStarted(false);
    setDone(false);
  }

  const totalCards = drillMode === "random"
    ? randomDeck.length
    : pronounList.length;
  const currentIndex = drillMode === "random" ? randomIndex : pronounIndex;

  async function handleCheck() {
    if (!currentConj || !currentPronoun) return;
    const expected = currentConj.forms[currentPronoun] ?? "";
    const correct = answer.trim().toLowerCase() === expected.toLowerCase();
    setIsCorrect(correct);
    setChecked(true);
    await recordAttempt(currentConj.id, "conjugation", correct, answer);
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      incorrect: s.incorrect + (correct ? 0 : 1),
    }));
    if (!correct) {
      if (drillMode === "random") {
        setWrongItems((p) => [...p, randomCard]);
      } else {
        setWrongItems((p) => [...p, currentPronoun]);
      }
    }
  }

  async function handleNext() {
    const next = currentIndex + 1;
    if (next >= totalCards) {
      await endSession();
      setDone(true);
    } else {
      if (drillMode === "random") setRandomIndex(next);
      else setPronounIndex(next);
      setAnswer("");
      setChecked(false);
      setIsCorrect(false);
    }
  }

  const expected = currentConj && currentPronoun ? (currentConj.forms[currentPronoun] ?? "") : "";

  // Setup screen
  if (!started) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <h1 className="text-2xl font-bold">Conjugation Drill</h1>

        {/* Mode selector */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Mode</p>
          <div className="flex gap-2">
            {(["pick", "random"] as DrillMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setDrillMode(m)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  drillMode === m
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {m === "pick" ? "Pick Verb" : "Random"}
              </button>
            ))}
          </div>
        </div>

        {drillMode === "pick" ? (
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
        ) : (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Questions per session</p>
            <div className="flex flex-wrap gap-2">
              {LIMIT_OPTIONS.map((l) => (
                <button
                  key={l ?? "all"}
                  onClick={() => setLimit(l)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                    limit === l
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {l ?? "All"}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Any verb · any form · randomized
            </p>
          </div>
        )}

        {drillMode === "pick" ? (
          pickConj ? (
            <Button className="w-full h-12" onClick={() => beginPickDrill()}>
              Start · {PRONOUNS.length} forms
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              No conjugation found for {selectedVerb} — {selectedTense}
            </p>
          )
        ) : (
          <Button className="w-full h-12" onClick={() => beginRandomDrill()}>
            Start · {limit !== null ? limit : conjugations.length * PRONOUNS.length} questions
          </Button>
        )}
      </div>
    );
  }

  // Done screen
  if (done) {
    const total = totalCards;
    const pct = Math.round((score.correct / total) * 100);
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6">
        <div className="text-5xl">{pct >= 70 ? "🎉" : "📚"}</div>
        <h1 className="text-2xl font-bold">Done!</h1>
        <p className="text-4xl font-bold">{pct}%</p>
        <p className="text-muted-foreground">{score.correct} / {total} correct</p>
        <Button
          onClick={() => drillMode === "random" ? beginRandomDrill() : beginPickDrill()}
          className="w-full max-w-xs"
        >
          Try Again
        </Button>
        {wrongItems.length > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              if (drillMode === "random") {
                beginRandomDrill(wrongItems as RandomCard[]);
              } else {
                beginPickDrill(wrongItems as string[]);
              }
            }}
            className="w-full max-w-xs border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
          >
            Practice {wrongItems.length} missed
          </Button>
        )}
        <Button variant="outline" onClick={() => setStarted(false)} className="w-full max-w-xs">
          {drillMode === "random" ? "Back to Setup" : "Change Verb"}
        </Button>
      </div>
    );
  }

  if (!currentConj || !currentPronoun) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold">{currentConj.verb}</span>
          {drillMode === "pick" && (
            <span className="text-muted-foreground text-sm">· {currentConj.meaning}</span>
          )}
          <Badge variant="secondary" className="text-xs">{verbType}</Badge>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {totalCards}
          </span>
          <Dialog>
            <DialogTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Hint"
              >
                <CircleHelp className="w-5 h-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-base">{cheatSheet.title}</DialogTitle>
              </DialogHeader>
              <div className="mt-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-2 text-muted-foreground font-medium">Pronoun</th>
                      <th className="text-left pb-2 text-muted-foreground font-medium">Ending</th>
                      <th className="text-left pb-2 text-muted-foreground font-medium">Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cheatSheet.rows.map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 font-medium">{row.pronoun}</td>
                        <td className="py-2 font-mono text-primary">{row.ending}</td>
                        <td className="py-2 text-muted-foreground">{row.example}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DialogContent>
          </Dialog>
          <button
            onClick={exitSession}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
            aria-label="Exit session"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Pronoun prompt card with hint button inside */}
      <div className="rounded-2xl border-2 border-border bg-card p-8 text-center relative">
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-semibold">
          Conjugate
        </p>
        <p className="text-3xl font-bold">{currentPronoun}</p>
        <p className="text-muted-foreground mt-1">{currentConj.verb}</p>
        {drillMode === "random" && (
          <p className="text-xs text-muted-foreground mt-2 italic">{currentConj.meaning}</p>
        )}
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
            {currentIndex + 1 >= totalCards ? "See Results" : "Next →"}
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
