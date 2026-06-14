"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

// The dark theme lives on <html class="dark"> (set by the no-FOUC script before
// hydration), so treat it as an external store and subscribe to class changes.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

/** A Preferences-row dark-mode switch, styled to match BoostToggle. */
export default function DarkModeToggle() {
  const isDark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false
  );

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <div className="flex items-center justify-between rounded-xl border px-4 py-3">
      <div>
        <p className="text-sm font-medium">Dark mode</p>
        <p className="text-xs text-muted-foreground">Switch between the light and dark theme</p>
      </div>
      <button
        onClick={toggle}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none",
          isDark ? "bg-primary" : "bg-muted"
        )}
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform",
            isDark ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
