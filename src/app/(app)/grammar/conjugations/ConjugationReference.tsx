"use client";

import { useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import type { Conjugation } from "@/lib/content";

const PRONOUNS = ["io", "tu", "lui/lei", "noi", "voi", "loro"];


function ConjugationTable({ conj }: { conj: Conjugation }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="bg-muted px-3 py-2 flex items-baseline gap-2">
        <p className="text-sm font-semibold">{conj.verb}</p>
        <p className="text-xs text-muted-foreground">{conj.meaning}</p>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {PRONOUNS.map((p) =>
            conj.forms[p] !== undefined ? (
              <tr key={p} className="border-t border-border first:border-0">
                <td className="px-3 py-1.5 text-muted-foreground w-20">{p}</td>
                <td className="px-3 py-1.5 font-medium">{conj.forms[p]}</td>
              </tr>
            ) : null
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function ConjugationReference({
  conjugations,
}: {
  conjugations: Conjugation[];
}) {
  const [query, setQuery] = useState("");

  const filtered = query
    ? conjugations.filter(
        (c) =>
          c.verb.toLowerCase().includes(query.toLowerCase()) ||
          c.meaning.toLowerCase().includes(query.toLowerCase()) ||
          Object.values(c.forms).some((f) =>
            f.toLowerCase().includes(query.toLowerCase())
          )
      )
    : conjugations;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/grammar"
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back to Guide"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Verb Conjugations</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Search verbs, meanings, or forms…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {/* Results */}
      {query.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          Search for a verb to see its conjugation table.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No verbs found for &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <ConjugationTable key={c.id} conj={c} />
          ))}
        </div>
      )}
    </div>
  );
}
