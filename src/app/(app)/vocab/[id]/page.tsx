import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getVocabById, SUBJECTS, tagsMatchSubject } from "@/lib/content";
import { conjugate, isItalianVerb } from "@/lib/conjugate";
import { lookupWord } from "@/lib/dictionary";
import { getExamples } from "@/lib/examples";
import { stripArticle } from "@/lib/parse-vocab";
import {
  ConjugationTables,
  AUX_LABEL,
  GENDER_LABEL,
  GENDER_STYLE,
  type Gender,
} from "@/components/ConjugationTables";
import SpeakButton from "@/components/SpeakButton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function VocabDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getVocabById(id);
  if (!item) notFound();

  // Existing vocab sometimes stores the article (e.g. "il ristorante"); look up the bare word.
  const term = stripArticle(item.italian);
  const verb = isItalianVerb(term);
  const wikt = await lookupWord(term);
  const conj = verb ? conjugate(term, { aux: wikt.aux ?? undefined }) : null;
  const examples = await getExamples(term);

  const gender = ((item.gender as Gender | null) ?? wikt.gender) as Gender | null;
  const subject = SUBJECTS.find((s) => tagsMatchSubject(item.tags, s.id));

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-28 space-y-6">
      <Link
        href="/vocab"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Vocab
      </Link>

      <header>
        <div className="flex items-center gap-2">
          <SpeakButton
            text={item.italian}
            className="text-muted-foreground hover:text-foreground shrink-0"
            iconClassName="h-5 w-5"
          />
          <h1 className="text-3xl font-bold">{item.italian}</h1>
        </div>
        <p className="mt-1 text-lg text-muted-foreground">{item.english}</p>
        {item.pronunciation && (
          <p className="text-sm text-muted-foreground italic tracking-wide">{item.pronunciation}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {item.partOfSpeech && (
            <Badge variant="secondary" className="text-[10px]">{item.partOfSpeech}</Badge>
          )}
          {conj?.reflexive && <Badge variant="secondary" className="text-[10px]">reflexive</Badge>}
          {gender && (gender === "m" || gender === "f" || gender === "mf") && (
            <Badge variant="outline" className={cn("text-[10px]", GENDER_STYLE[gender])}>
              {GENDER_LABEL[gender]}
            </Badge>
          )}
          {conj && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                conj.aux === "ESSERE" && "border-blue-500 text-blue-600 dark:text-blue-400",
                conj.aux === "BOTH" && "border-amber-500 text-amber-600 dark:text-amber-400",
              )}
            >
              aux: {AUX_LABEL[conj.aux]}
            </Badge>
          )}
          {conj?.gerund && (
            <Badge variant="outline" className="text-[10px]">ger: {conj.gerund}</Badge>
          )}
          {subject && (
            <Badge variant="secondary" className="text-[10px]">
              {subject.emoji} {subject.label}
            </Badge>
          )}
        </div>
      </header>

      {conj && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Conjugation</h2>
          <div className="rounded-lg border border-border bg-card p-4">
            <ConjugationTables conjugation={conj} />
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Examples</h2>
        {examples.length === 0 ? (
          <p className="text-sm text-muted-foreground">No example sentences found.</p>
        ) : (
          <ul className="space-y-2">
            {examples.map((ex, i) => (
              <li key={i} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-start gap-2">
                  <SpeakButton
                    text={ex.it}
                    className="mt-0.5 text-muted-foreground hover:text-foreground shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-medium">{ex.it}</p>
                    <p className="text-sm text-muted-foreground">{ex.en}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
