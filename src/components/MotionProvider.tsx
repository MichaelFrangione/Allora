"use client";

import { MotionConfig } from "motion/react";

/** App-wide motion settings — honours the OS "reduce motion" preference. */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
