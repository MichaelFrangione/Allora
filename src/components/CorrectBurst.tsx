"use client";

import { useEffect, useMemo, useState } from "react";

const EMOJIS = ["🎉", "✨", "⭐", "💚", "🎊"];
const PARTICLE_COUNT = 16;

// Deterministic 0..1 jitter — render must stay pure, so no Math.random here.
function jitter(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * A one-shot confetti-style burst shown when an answer is correct.
 * Render it keyed by a counter so it replays each time, e.g.
 *   {burst > 0 && <CorrectBurst key={burst} />}
 * It's absolutely positioned and pointer-events-none, so drop it inside any
 * `relative` container; it auto-removes after the animation.
 */
export default function CorrectBurst() {
  const [gone, setGone] = useState(false);

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + jitter(i, 1) * 0.5;
        const dist = 70 + jitter(i, 2) * 80;
        return {
          emoji: EMOJIS[i % EMOJIS.length],
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          rot: (jitter(i, 3) * 2 - 1) * 220,
          delay: jitter(i, 4) * 80,
        };
      }),
    []
  );

  useEffect(() => {
    const t = setTimeout(() => setGone(true), 900);
    return () => clearTimeout(t);
  }, []);

  if (gone) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-visible" aria-hidden>
      <span className="correct-pop text-5xl">✅</span>
      {particles.map((p, i) => (
        <span
          key={i}
          className="correct-particle"
          style={
            {
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              "--rot": `${p.rot}deg`,
              animationDelay: `${p.delay}ms`,
            } as React.CSSProperties
          }
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
