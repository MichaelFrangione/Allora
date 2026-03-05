"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export const BOOST_KEY = "boost_weak_items";

export function getBoostEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(BOOST_KEY);
  return v === null ? true : v === "true";
}

export default function BoostToggle() {
  const [enabled, setEnabled] = useState(() => getBoostEnabled());

  function toggle() {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(BOOST_KEY, String(next));
      return next;
    });
  }

  return (
    <div className="flex items-center justify-between rounded-xl border px-4 py-3">
      <div>
        <p className="text-sm font-medium">Boost weak items</p>
        <p className="text-xs text-muted-foreground">
          Items below 70% accuracy appear more often in every mode
        </p>
      </div>
      <button
        onClick={toggle}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none",
          enabled ? "bg-primary" : "bg-muted"
        )}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform",
            enabled ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
