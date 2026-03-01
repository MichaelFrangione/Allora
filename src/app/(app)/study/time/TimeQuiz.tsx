"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Question data ──────────────────────────────────────────────────────────────

type Q = {
  id: string;
  prompt: string;
  promptSub: string;
  correct: string;
  options: string[];
  category: string;
};

const ALL_QUESTIONS: Q[] = [
  // ── Telling the time — clock → Italian ───────────────────────────────────────
  {
    id: "t01", category: "Telling the time",
    prompt: "🕒  3:00", promptSub: "How do you say this time in Italian?",
    correct: "Sono le tre.",
    options: ["Sono le tre.", "Sono le due.", "Sono le quattro.", "Sono le cinque."],
  },
  {
    id: "t02", category: "Telling the time",
    prompt: "🕐  1:00", promptSub: "How do you say this time in Italian?",
    correct: "È l'una.",
    options: ["Sono le una.", "È l'una.", "Sono le due.", "È mezzogiorno."],
  },
  {
    id: "t03", category: "Telling the time",
    prompt: "☀️  Noon (12:00)", promptSub: "How do you say this in Italian?",
    correct: "È mezzogiorno.",
    options: ["È mezzanotte.", "Sono le dodici.", "È mezzogiorno.", "Sono le undici."],
  },
  {
    id: "t04", category: "Telling the time",
    prompt: "🌙  Midnight (12:00)", promptSub: "How do you say this in Italian?",
    correct: "È mezzanotte.",
    options: ["È mezzogiorno.", "Sono le dodici di notte.", "È mezzanotte.", "Sono le undici di sera."],
  },
  {
    id: "t05", category: "Telling the time",
    prompt: "🕙  10:30", promptSub: "How do you say this time in Italian?",
    correct: "Sono le dieci e mezza.",
    options: ["Sono le dieci e mezza.", "Sono le dieci e un quarto.", "Sono le undici meno un quarto.", "Sono le dieci in punto."],
  },
  {
    id: "t06", category: "Telling the time",
    prompt: "🕘  9:15", promptSub: "How do you say this time in Italian?",
    correct: "Sono le nove e un quarto.",
    options: ["Sono le nove e mezza.", "Sono le otto e un quarto.", "Sono le nove e un quarto.", "Sono le dieci meno un quarto."],
  },
  {
    id: "t07", category: "Telling the time",
    prompt: "🕔  4:45", promptSub: "How do you say this time in Italian?",
    correct: "Sono le cinque meno un quarto.",
    options: ["Sono le quattro e mezza.", "Sono le cinque e un quarto.", "Sono le quattro meno un quarto.", "Sono le cinque meno un quarto."],
  },
  {
    id: "t08", category: "Telling the time",
    prompt: "🕗  7:00 exactly", promptSub: "How do you say this time in Italian?",
    correct: "Sono le sette in punto.",
    options: ["Sono le sette.", "Sono le sette in punto.", "È le sette in punto.", "Sono le sei e mezza."],
  },
  // ── Time expressions — Italian → English ─────────────────────────────────────
  {
    id: "t09", category: "Time expressions",
    prompt: "Che ore sono?", promptSub: "What does this mean?",
    correct: "What time is it?",
    options: ["What time is it?", "At what time?", "What day is it?", "When is it?"],
  },
  {
    id: "t10", category: "Time expressions",
    prompt: "A che ora…?", promptSub: "What does this mean?",
    correct: "At what time…?",
    options: ["What time is it?", "At what time…?", "Around what time?", "How long?"],
  },
  {
    id: "t11", category: "Time expressions",
    prompt: "in punto", promptSub: "What does this mean?",
    correct: "exactly / on the dot",
    options: ["half past", "quarter past", "exactly / on the dot", "almost"],
  },
  {
    id: "t12", category: "Time expressions",
    prompt: "e mezza / e trenta", promptSub: "What does this mean?",
    correct: "half past",
    options: ["quarter past", "half past", "quarter to", "exactly"],
  },
  {
    id: "t13", category: "Time expressions",
    prompt: "e un quarto / e quindici", promptSub: "What does this mean?",
    correct: "quarter past",
    options: ["quarter to", "half past", "quarter past", "on the dot"],
  },
  {
    id: "t14", category: "Time expressions",
    prompt: "meno un quarto", promptSub: "What does this mean?",
    correct: "quarter to",
    options: ["quarter past", "quarter to", "half past", "five to"],
  },
  {
    id: "t15", category: "Time expressions",
    prompt: "Alle otto.", promptSub: "What does this mean?",
    correct: "At eight o'clock.",
    options: ["At eight o'clock.", "It's eight o'clock.", "Eight o'clock sharp.", "Around eight."],
  },
  // ── Parts of the day ─────────────────────────────────────────────────────────
  {
    id: "t16", category: "Parts of the day",
    prompt: "di mattina", promptSub: "What does this mean?",
    correct: "in the morning",
    options: ["in the evening", "in the afternoon", "in the morning", "at night"],
  },
  {
    id: "t17", category: "Parts of the day",
    prompt: "di pomeriggio", promptSub: "What does this mean?",
    correct: "in the afternoon",
    options: ["in the morning", "in the afternoon", "in the evening", "at noon"],
  },
  {
    id: "t18", category: "Parts of the day",
    prompt: "di sera", promptSub: "What does this mean?",
    correct: "in the evening",
    options: ["in the morning", "at night", "in the afternoon", "in the evening"],
  },
  {
    id: "t19", category: "Parts of the day",
    prompt: "la notte", promptSub: "What does this mean?",
    correct: "the night",
    options: ["the morning", "the afternoon", "the night", "the evening"],
  },
  {
    id: "t20", category: "Parts of the day",
    prompt: "in the morning", promptSub: "How do you say this in Italian?",
    correct: "di mattina",
    options: ["di sera", "di pomeriggio", "di notte", "di mattina"],
  },
  {
    id: "t21", category: "Parts of the day",
    prompt: "in the evening", promptSub: "How do you say this in Italian?",
    correct: "di sera",
    options: ["di mattina", "di sera", "di pomeriggio", "di notte"],
  },
  // ── Days of the week — Italian → English ─────────────────────────────────────
  {
    id: "t22", category: "Days of the week",
    prompt: "lunedì", promptSub: "What day is this?",
    correct: "Monday",
    options: ["Monday", "Tuesday", "Wednesday", "Saturday"],
  },
  {
    id: "t23", category: "Days of the week",
    prompt: "martedì", promptSub: "What day is this?",
    correct: "Tuesday",
    options: ["Monday", "Tuesday", "Thursday", "Friday"],
  },
  {
    id: "t24", category: "Days of the week",
    prompt: "mercoledì", promptSub: "What day is this?",
    correct: "Wednesday",
    options: ["Tuesday", "Wednesday", "Thursday", "Sunday"],
  },
  {
    id: "t25", category: "Days of the week",
    prompt: "giovedì", promptSub: "What day is this?",
    correct: "Thursday",
    options: ["Monday", "Wednesday", "Thursday", "Friday"],
  },
  {
    id: "t26", category: "Days of the week",
    prompt: "venerdì", promptSub: "What day is this?",
    correct: "Friday",
    options: ["Tuesday", "Thursday", "Friday", "Saturday"],
  },
  {
    id: "t27", category: "Days of the week",
    prompt: "sabato", promptSub: "What day is this?",
    correct: "Saturday",
    options: ["Friday", "Saturday", "Sunday", "Monday"],
  },
  {
    id: "t28", category: "Days of the week",
    prompt: "domenica", promptSub: "What day is this?",
    correct: "Sunday",
    options: ["Friday", "Saturday", "Sunday", "Monday"],
  },
  // ── Days — English → Italian ─────────────────────────────────────────────────
  {
    id: "t29", category: "Days of the week",
    prompt: "Monday", promptSub: "How do you say this in Italian?",
    correct: "lunedì",
    options: ["lunedì", "martedì", "mercoledì", "sabato"],
  },
  {
    id: "t30", category: "Days of the week",
    prompt: "Wednesday", promptSub: "How do you say this in Italian?",
    correct: "mercoledì",
    options: ["lunedì", "giovedì", "mercoledì", "venerdì"],
  },
  {
    id: "t31", category: "Days of the week",
    prompt: "Sunday", promptSub: "How do you say this in Italian?",
    correct: "domenica",
    options: ["sabato", "domenica", "venerdì", "giovedì"],
  },
  // ── Months — Italian → English ───────────────────────────────────────────────
  {
    id: "t32", category: "Months",
    prompt: "gennaio", promptSub: "What month is this?",
    correct: "January",
    options: ["January", "February", "June", "July"],
  },
  {
    id: "t33", category: "Months",
    prompt: "febbraio", promptSub: "What month is this?",
    correct: "February",
    options: ["January", "February", "March", "April"],
  },
  {
    id: "t34", category: "Months",
    prompt: "marzo", promptSub: "What month is this?",
    correct: "March",
    options: ["February", "March", "May", "August"],
  },
  {
    id: "t35", category: "Months",
    prompt: "aprile", promptSub: "What month is this?",
    correct: "April",
    options: ["March", "April", "June", "October"],
  },
  {
    id: "t36", category: "Months",
    prompt: "maggio", promptSub: "What month is this?",
    correct: "May",
    options: ["April", "May", "June", "March"],
  },
  {
    id: "t37", category: "Months",
    prompt: "giugno", promptSub: "What month is this?",
    correct: "June",
    options: ["May", "June", "July", "August"],
  },
  {
    id: "t38", category: "Months",
    prompt: "luglio", promptSub: "What month is this?",
    correct: "July",
    options: ["June", "July", "August", "September"],
  },
  {
    id: "t39", category: "Months",
    prompt: "agosto", promptSub: "What month is this?",
    correct: "August",
    options: ["June", "July", "August", "September"],
  },
  {
    id: "t40", category: "Months",
    prompt: "settembre", promptSub: "What month is this?",
    correct: "September",
    options: ["August", "September", "October", "November"],
  },
  {
    id: "t41", category: "Months",
    prompt: "ottobre", promptSub: "What month is this?",
    correct: "October",
    options: ["September", "October", "November", "December"],
  },
  {
    id: "t42", category: "Months",
    prompt: "novembre", promptSub: "What month is this?",
    correct: "November",
    options: ["September", "October", "November", "December"],
  },
  {
    id: "t43", category: "Months",
    prompt: "dicembre", promptSub: "What month is this?",
    correct: "December",
    options: ["October", "November", "December", "January"],
  },
  // ── Months — English → Italian ───────────────────────────────────────────────
  {
    id: "t44", category: "Months",
    prompt: "July", promptSub: "How do you say this in Italian?",
    correct: "luglio",
    options: ["giugno", "luglio", "agosto", "settembre"],
  },
  {
    id: "t45", category: "Months",
    prompt: "March", promptSub: "How do you say this in Italian?",
    correct: "marzo",
    options: ["febbraio", "marzo", "aprile", "maggio"],
  },
  {
    id: "t46", category: "Months",
    prompt: "October", promptSub: "How do you say this in Italian?",
    correct: "ottobre",
    options: ["settembre", "ottobre", "novembre", "dicembre"],
  },
  // ── Seasons ──────────────────────────────────────────────────────────────────
  {
    id: "t47", category: "Seasons",
    prompt: "la primavera", promptSub: "What season is this?",
    correct: "spring",
    options: ["spring", "summer", "autumn", "winter"],
  },
  {
    id: "t48", category: "Seasons",
    prompt: "l'estate", promptSub: "What season is this?",
    correct: "summer",
    options: ["spring", "summer", "autumn", "winter"],
  },
  {
    id: "t49", category: "Seasons",
    prompt: "l'autunno", promptSub: "What season is this?",
    correct: "autumn / fall",
    options: ["spring", "summer", "autumn / fall", "winter"],
  },
  {
    id: "t50", category: "Seasons",
    prompt: "l'inverno", promptSub: "What season is this?",
    correct: "winter",
    options: ["spring", "summer", "autumn", "winter"],
  },
  {
    id: "t51", category: "Seasons",
    prompt: "summer", promptSub: "How do you say this in Italian?",
    correct: "l'estate",
    options: ["la primavera", "l'estate", "l'autunno", "l'inverno"],
  },
  {
    id: "t52", category: "Seasons",
    prompt: "winter", promptSub: "How do you say this in Italian?",
    correct: "l'inverno",
    options: ["la primavera", "l'estate", "l'autunno", "l'inverno"],
  },
  {
    id: "t53", category: "Seasons",
    prompt: "autumn / fall", promptSub: "How do you say this in Italian?",
    correct: "l'autunno",
    options: ["la primavera", "l'estate", "l'autunno", "l'inverno"],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const CATEGORIES = ["All", "Telling the time", "Time expressions", "Parts of the day", "Days of the week", "Months", "Seasons"];

// ── Component ─────────────────────────────────────────────────────────────────

export default function TimeQuiz() {
  const [category, setCategory] = useState("All");
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const activeQuestions =
    category === "All"
      ? ALL_QUESTIONS
      : ALL_QUESTIONS.filter((q) => q.category === category);

  function beginDrill(filterIds?: string[]) {
    let pool = category === "All" ? ALL_QUESTIONS : ALL_QUESTIONS.filter((q) => q.category === category);
    if (filterIds) {
      const filtered = pool.filter((q) => filterIds.includes(q.id));
      if (filtered.length > 0) pool = filtered;
    }
    setQuestions(shuffle(pool));
    setIndex(0);
    setSelected(null);
    setSubmitted(false);
    setScore({ correct: 0, incorrect: 0 });
    setWrongIds([]);
    setDone(false);
    setStarted(true);
  }

  function exitSession() {
    setStarted(false);
    setDone(false);
  }

  const q = questions[index];

  function handleSubmit() {
    if (!selected || !q) return;
    const correct = selected === q.correct;
    if (!correct) setWrongIds((ids) => [...ids, q.id]);
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      incorrect: s.incorrect + (correct ? 0 : 1),
    }));
    setSubmitted(true);
  }

  function handleNext() {
    const next = index + 1;
    if (next >= questions.length) {
      setDone(true);
    } else {
      setIndex(next);
      setSelected(null);
      setSubmitted(false);
    }
  }

  // ── Setup screen ────────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold">Time &amp; Dates Quiz</h1>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm border transition-colors",
                  category === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <Button
          className="w-full h-12"
          onClick={() => beginDrill()}
          disabled={activeQuestions.length === 0}
        >
          Start · {activeQuestions.length} question{activeQuestions.length !== 1 ? "s" : ""}
        </Button>
      </div>
    );
  }

  // ── Done screen ─────────────────────────────────────────────────────────────
  if (done) {
    const pct = Math.round((score.correct / questions.length) * 100);
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6">
        <div className="text-5xl">{pct >= 70 ? "🎉" : "📚"}</div>
        <h1 className="text-2xl font-bold">Quiz Complete!</h1>
        <p className="text-4xl font-bold">{pct}%</p>
        <p className="text-muted-foreground">{score.correct} / {questions.length} correct</p>
        <Button onClick={() => beginDrill()} className="w-full max-w-xs">Try Again</Button>
        {wrongIds.length > 0 && (
          <Button
            variant="outline"
            onClick={() => beginDrill(wrongIds)}
            className="w-full max-w-xs border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
          >
            Practice {wrongIds.length} missed
          </Button>
        )}
        <Button variant="outline" onClick={() => exitSession()} className="w-full max-w-xs">
          Change Category
        </Button>
      </div>
    );
  }

  if (!q) return null;

  // ── Quiz screen ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold">Time &amp; Dates</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{index + 1} / {questions.length}</span>
          <button
            onClick={exitSession}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
            aria-label="Exit"
          >
            ✕
          </button>
        </div>
      </div>

      <Badge variant="outline" className="text-xs">{q.category}</Badge>

      <div className="rounded-2xl border-2 border-border bg-card px-6 py-8 text-center space-y-2">
        <p className="text-2xl font-bold">{q.prompt}</p>
        <p className="text-sm text-muted-foreground">{q.promptSub}</p>
      </div>

      <RadioGroup
        value={selected ?? ""}
        onValueChange={(v) => { if (!submitted) setSelected(v); }}
        className="space-y-3"
      >
        {q.options.map((opt) => {
          let optClass = "border-border";
          if (submitted) {
            if (opt === q.correct) optClass = "border-green-500 bg-green-50 dark:bg-green-950";
            else if (opt === selected) optClass = "border-red-400 bg-red-50 dark:bg-red-950";
          }
          return (
            <Label
              key={opt}
              htmlFor={`opt-${opt}`}
              className={cn(
                "flex items-center gap-3 border-2 rounded-xl px-4 py-4 cursor-pointer transition-colors text-base",
                optClass,
                !submitted && selected === opt && "border-primary"
              )}
            >
              <RadioGroupItem value={opt} id={`opt-${opt}`} />
              {opt}
            </Label>
          );
        })}
      </RadioGroup>

      <div className="flex gap-3">
        {!submitted ? (
          <Button className="flex-1 h-12" onClick={handleSubmit} disabled={!selected}>
            Check
          </Button>
        ) : (
          <Button className="flex-1 h-12" onClick={handleNext}>
            {index + 1 >= questions.length ? "See Results" : "Next →"}
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
