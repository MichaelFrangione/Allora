"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuizEngine, buildSessionPool, shuffle, DEFAULT_LIMIT } from "@/lib/useQuizEngine";
import { useSpeech } from "@/lib/useSpeech";
import type { MapPlace, MapQuestion, TownMap } from "@/lib/content";
import CorrectBurst from "@/components/CorrectBurst";
import GlossedText from "@/components/GlossedText";
import QuizHeader from "@/components/quiz/QuizHeader";
import LimitPicker from "@/components/quiz/LimitPicker";
import DoneScreen from "@/components/quiz/DoneScreen";
import OptionList from "@/components/quiz/OptionList";

type RoundType = MapQuestion["type"];

const ROUNDS: { type: RoundType; label: string; emoji: string; desc: string }[] = [
  { type: "trova", label: "Trova il luogo", emoji: "🔎", desc: "Dov'è la banca? Tap it." },
  { type: "errand", label: "Dove vai se devi…?", emoji: "🛍️", desc: "Devo comprare il pane → tap where you go." },
  { type: "dove-sei", label: "Dove sei?", emoji: "🧭", desc: "Follow the directions, tap where you end up." },
  { type: "posizione", label: "La posizione", emoji: "📍", desc: "Accanto a, di fronte a, tra… pick the word." },
  { type: "percorso", label: "Come ci arrivo?", emoji: "🚶", desc: "Pick the right directions between two places." },
];

const TAP_TYPES: RoundType[] = ["trova", "errand", "dove-sei"];
const isTap = (q: MapQuestion) => TAP_TYPES.includes(q.type);

/** A crop of the source image, [x, y, w, h]. */
type Box = [number, number, number, number];

/**
 * The region to show for a choice question: the highlighted places plus a
 * margin (so street names stay visible), widened so the crop is never much
 * taller than it is wide — keeps it phone-sized.
 */
function focusBox(map: TownMap, ids: string[]): Box {
  const rects = ids.map((id) => map.places.find((p) => p.id === id)!.rect);
  const PAD = 70;
  let x0 = Math.min(...rects.map((r) => r[0])) - PAD;
  let y0 = Math.min(...rects.map((r) => r[1])) - PAD;
  let x1 = Math.max(...rects.map((r) => r[0] + r[2])) + PAD;
  let y1 = Math.max(...rects.map((r) => r[1] + r[3])) + PAD;
  const minW = (y1 - y0) * 1.1;
  if (x1 - x0 < minW) {
    const grow = (minW - (x1 - x0)) / 2;
    x0 -= grow;
    x1 += grow;
  }
  const minH = (x1 - x0) * 0.5;
  if (y1 - y0 < minH) {
    const grow = (minH - (y1 - y0)) / 2;
    y0 -= grow;
    y1 += grow;
  }
  x0 = Math.max(0, x0);
  y0 = Math.max(0, y0);
  x1 = Math.min(map.width, x1);
  y1 = Math.min(map.height, y1);
  return [x0, y0, x1 - x0, y1 - y0];
}

type SpotState = "idle" | "correct" | "wrong" | "highlight";

function MapView({
  map,
  box,
  zoom = 1,
  interactive,
  spotState,
  startId,
  showLabelFor,
  onTap,
}: {
  map: TownMap;
  box?: Box;
  zoom?: number;
  interactive: boolean;
  spotState: (p: MapPlace) => SpotState;
  startId?: string;
  showLabelFor?: string[];
  onTap?: (p: MapPlace) => void;
}) {
  const [bx, by, bw, bh] = box ?? [0, 0, map.width, map.height];
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-border bg-muted shadow-[0_2px_0_0_var(--border-deep)]",
        zoom > 1 ? "overflow-auto max-h-[62vh] overscroll-contain" : "overflow-hidden"
      )}
    >
      {/* Viewport sized to the crop; the full map is positioned inside it. */}
      <div className="relative overflow-hidden" style={{ width: `${zoom * 100}%`, aspectRatio: `${bw} / ${bh}` }}>
        <div
          className="absolute"
          style={{
            left: `-${pct(bx, bw)}`,
            top: `-${pct(by, bh)}`,
            width: pct(map.width, bw),
            height: pct(map.height, bh),
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- plain img keeps the % overlay math exact */}
          <img
            src={map.image}
            alt="Mappa della città di Aurora"
            className="block h-full w-full select-none"
            draggable={false}
          />
          {map.places.map((p) => {
            const state = spotState(p);
            const [x, y, w, h] = p.rect;
            const style = {
              left: pct(x, map.width),
              top: pct(y, map.height),
              width: pct(w, map.width),
              height: pct(h, map.height),
            };
            const cls = cn(
              "absolute rounded-xl transition-colors",
              state === "correct" && "border-[3px] border-primary bg-primary/25",
              state === "wrong" && "border-[3px] border-destructive bg-destructive/25",
              state === "highlight" && "border-[3px] border-dashed border-gold bg-gold/20",
              interactive && state === "idle" && "hover:bg-primary/15 active:bg-primary/25"
            );
            const label = showLabelFor?.includes(p.id) && (
              <span className="pointer-events-none absolute left-1/2 top-1 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-2 py-0.5 text-[11px] font-semibold text-background shadow">
                {p.label}
              </span>
            );
            const pin = startId === p.id && (
              <span className="pointer-events-none absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold text-white shadow">
                📍 Partenza
              </span>
            );
            return interactive ? (
              <button
                key={p.id}
                type="button"
                aria-label={p.label}
                onClick={() => onTap?.(p)}
                className={cls}
                style={style}
              >
                {pin}
                {label}
              </button>
            ) : (
              <div key={p.id} className={cls} style={style}>
                {pin}
                {label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ZoomToggle({ zoom, onChange }: { zoom: number; onChange: (z: number) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(zoom > 1 ? 1 : 2)}
      className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted"
    >
      {zoom > 1 ? "🔍 Tutta la mappa" : "🔍 Ingrandisci"}
    </button>
  );
}

export default function MapGame({ map, weakIds = [] }: { map: TownMap; weakIds?: string[] }) {
  const [round, setRound] = useState<RoundType | "all">("all");
  const [limit, setLimit] = useState<number | null>(DEFAULT_LIMIT);
  const [exploring, setExploring] = useState(false);
  const [explored, setExplored] = useState<MapPlace | null>(null);
  const [zoom, setZoom] = useState(1);
  const [tapped, setTapped] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const { speak, speaking } = useSpeech();

  const engine = useQuizEngine<MapQuestion>({ mode: "mappa", getId: (q) => q.id });

  const placeById = new Map(map.places.map((p) => [p.id, p]));
  const activeQuestions = round === "all" ? map.questions : map.questions.filter((q) => q.type === round);
  const startCount = limit === null ? activeQuestions.length : Math.min(limit, activeQuestions.length);

  function beginDrill(filterIds?: string[]) {
    let pool = activeQuestions;
    if (filterIds) {
      const filtered = pool.filter((q) => filterIds.includes(q.id));
      if (filtered.length > 0) pool = filtered;
      pool = shuffle(pool);
    } else {
      pool = buildSessionPool(pool, { getId: (q) => q.id, weakIds, limit });
    }
    // Data lists the correct option first — shuffle per session.
    engine.begin(pool.map((q) => (q.options ? { ...q, options: shuffle(q.options) } : q)));
  }

  // Reset per-question state when the engine advances (render-time adjustment).
  const questionKey = `${engine.started ? "s" : "-"}:${engine.index}`;
  const [prevQuestionKey, setPrevQuestionKey] = useState(questionKey);
  if (prevQuestionKey !== questionKey) {
    setPrevQuestionKey(questionKey);
    setTapped(null);
    setSelected(null);
  }

  // ── Explore: tap any place to hear its name ────────────────────────────────
  if (exploring) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Esplora la città</h1>
          <button
            onClick={() => {
              setExploring(false);
              setExplored(null);
            }}
            className="text-muted-foreground hover:text-foreground text-lg leading-none"
            aria-label="Back"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-muted-foreground">Tap a place to hear its name and how to say you&apos;re going there.</p>
        <div className="flex justify-end">
          <ZoomToggle zoom={zoom} onChange={setZoom} />
        </div>
        <MapView
          map={map}
          zoom={zoom}
          interactive
          spotState={(p) => (explored?.id === p.id ? "highlight" : "idle")}
          onTap={(p) => {
            setExplored(p);
            speak(p.name);
          }}
        />
        <div className="min-h-24 rounded-2xl border-2 border-border bg-card px-5 py-4 shadow-[0_2px_0_0_var(--border-deep)]">
          {explored ? (
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xl font-bold">
                  {explored.emoji} <GlossedText text={explored.name} />
                </p>
                <p className="text-sm text-muted-foreground">
                  <GlossedText text={`Vado ${explored.vado}.`} />
                </p>
              </div>
              <button
                onClick={() => speak(`${explored.name}. Vado ${explored.vado}.`)}
                className={cn("text-xl transition-opacity", speaking ? "opacity-40" : "opacity-70 hover:opacity-100")}
                aria-label="Hear it"
              >
                🔊
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nessun luogo selezionato.</p>
          )}
        </div>
      </div>
    );
  }

  // ── Setup ──────────────────────────────────────────────────────────────────
  if (!engine.started) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">La Città di Aurora 🗺️</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <GlossedText text="Dove si trova? Come ci arrivo?" />
          </p>
        </div>

        <button type="button" onClick={() => setExploring(true)} className="block w-full text-left">
          <MapView map={map} box={[0, 0, map.width, 520]} interactive={false} spotState={() => "idle"} />
          <span className="mt-2 block text-center text-sm font-semibold text-primary">👀 Esplora la mappa →</span>
        </button>

        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">How it works</p>
          <p className="text-sm text-muted-foreground">
            The class map of Aurora. Tap places on the map to find them, work out where to go for an errand, and
            follow directions to see where you end up — or pick the right position word and route. Use 🔍 to zoom on a
            phone.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Round</p>
          <div className="grid gap-2">
            {[{ type: "all" as const, label: "Tutti", emoji: "🎲", desc: "A mix of every round." }, ...ROUNDS].map((r) => {
              const count = r.type === "all" ? map.questions.length : map.questions.filter((q) => q.type === r.type).length;
              return (
                <button
                  key={r.type}
                  type="button"
                  onClick={() => setRound(r.type)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors",
                    round === r.type ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted"
                  )}
                >
                  <span className="text-xl">{r.emoji}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold">{r.label}</span>
                    <span className="block text-xs text-muted-foreground">{r.desc}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <LimitPicker value={limit} onChange={setLimit} allCount={activeQuestions.length} />

        <Button className="w-full h-12" onClick={() => beginDrill()} disabled={activeQuestions.length === 0}>
          Start · {startCount} question{startCount !== 1 ? "s" : ""}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Prefer text?{" "}
          <Link href="/study/direzioni" className="font-semibold text-primary">
            🧭 Dove si trova? drill
          </Link>
          {" · "}
          <Link href="/grammar/city" className="font-semibold text-primary">
            📖 Guide
          </Link>
        </p>
      </div>
    );
  }

  // ── Done ───────────────────────────────────────────────────────────────────
  if (engine.done) {
    return (
      <DoneScreen
        score={engine.score}
        xp={engine.xp}
        wrongCount={engine.wrongIds.length}
        onRetry={() => beginDrill()}
        onPracticeMissed={() => beginDrill(engine.wrongIds)}
        onBack={engine.backToSetup}
        backLabel="Change Round"
      />
    );
  }

  const q = engine.current;
  if (!q) return null;
  const submitted = engine.submitted;
  const wasCorrect = engine.lastCorrect === true;
  const roundInfo = ROUNDS.find((r) => r.type === q.type)!;
  const tap = isTap(q);
  const answers = q.answers ?? [];

  function handleTap(p: MapPlace) {
    if (submitted) return;
    setTapped(p.id);
    engine.submit(answers.includes(p.id), p.id);
  }

  function spotState(p: MapPlace): SpotState {
    if (tap) {
      if (!submitted) return "idle";
      if (answers.includes(p.id)) return "correct";
      if (p.id === tapped) return "wrong";
      return "idle";
    }
    return q!.highlight?.includes(p.id) ? "highlight" : "idle";
  }

  const answerNames = answers.map((id) => placeById.get(id)?.label ?? id).join(" / ");

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <QuizHeader title="La Città di Aurora" index={engine.index} total={engine.deck.length} onExit={engine.exit} />

      <motion.div
        key={`card-${engine.index}`}
        initial={{ y: 24, opacity: 0 }}
        animate={submitted && !wasCorrect ? { y: 0, opacity: 1, x: [0, -8, 8, -5, 5, 0] } : { y: 0, opacity: 1, x: 0 }}
        transition={{
          default: { type: "spring", stiffness: 420, damping: 28 },
          x: { duration: 0.4, ease: "easeInOut" },
          opacity: { duration: 0.15 },
        }}
        className="relative rounded-2xl border-2 border-border bg-card px-5 py-4 space-y-2 shadow-[0_2px_0_0_var(--border-deep)]"
      >
        {engine.burst > 0 && <CorrectBurst key={engine.burst} />}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {roundInfo.emoji} {roundInfo.label}
            {engine.currentIsRetry && <span className="ml-2 normal-case text-gold-deep">↻ Retry</span>}
          </span>
          <button
            onClick={() => speak(q.prompt.replace(/_{3,}/, "…"))}
            className={cn("text-lg transition-opacity", speaking ? "opacity-40" : "opacity-60 hover:opacity-100")}
            aria-label="Hear it"
          >
            🔊
          </button>
        </div>
        <p className={cn("font-medium leading-relaxed", q.type === "dove-sei" ? "text-base" : "text-lg")}>
          <GlossedText text={submitted && q.correct && q.type === "posizione" ? q.prompt.replace(/_{3,}/, q.correct) : q.prompt} />
        </p>
        {tap && !submitted && <p className="text-xs text-muted-foreground">👆 Tap the place on the map.</p>}
      </motion.div>

      {tap && (
        <div className="flex justify-end">
          <ZoomToggle zoom={zoom} onChange={setZoom} />
        </div>
      )}

      <MapView
        map={map}
        box={tap ? undefined : focusBox(map, q.highlight ?? [])}
        zoom={tap ? zoom : 1}
        interactive={tap && !submitted}
        spotState={spotState}
        startId={q.start}
        showLabelFor={submitted && tap ? [...answers, ...(tapped ? [tapped] : [])] : undefined}
        onTap={handleTap}
      />

      {!tap && q.options && q.correct && (
        <OptionList
          options={q.options}
          selected={selected}
          submitted={submitted}
          correct={q.correct}
          onSelect={setSelected}
          className="space-y-3"
          optionClassName={q.type === "percorso" ? "text-sm px-4 py-3 text-left leading-snug" : undefined}
        />
      )}

      {submitted && (
        <div className="space-y-2">
          {!wasCorrect && (
            <p className="text-sm font-medium text-center text-red-500">
              {tap ? `Not quite — it's the ${answerNames}.` : "Not quite."} You&apos;ll see this one again.
            </p>
          )}
          <div className="rounded-xl bg-muted px-4 py-3">
            <p className="text-sm text-muted-foreground">
              <GlossedText text={q.explanation} />
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {!submitted ? (
          tap ? null : (
            <Button className="flex-1 h-12" onClick={() => engine.submit(selected === q.correct, selected ?? undefined)} disabled={!selected}>
              Check
            </Button>
          )
        ) : wasCorrect ? (
          <Button variant="ghost" className="flex-1 h-12 text-green-600 pointer-events-none">
            Correct! ✓
          </Button>
        ) : (
          <Button className="flex-1 h-12" onClick={engine.next}>
            {engine.index + 1 >= engine.deck.length ? "See Results" : "Next →"}
          </Button>
        )}
      </div>

      <div className="flex justify-between text-sm px-1">
        <span className="text-green-600 font-medium">✓ {engine.score.correct}</span>
        <span className="text-red-500 font-medium">✗ {engine.score.incorrect}</span>
      </div>
    </div>
  );
}
