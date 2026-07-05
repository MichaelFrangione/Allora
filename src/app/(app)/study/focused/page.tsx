import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

const drills = [
  {
    href: "/study/saluti",
    label: "Saluti",
    emoji: "👋",
    desc: "Greetings & farewells — ciao, buongiorno, arrivederci",
  },
  {
    href: "/study/interrogativi",
    label: "Interrogativi",
    emoji: "❓",
    desc: "Question words — chi, cosa, come, quando, dove",
  },
  {
    href: "/study/dimostrativi",
    label: "Dimostrativi",
    emoji: "👆",
    desc: "This & that — questo, quello, questi, quelli",
  },
  {
    href: "/study/riflessivi",
    label: "Verbi Riflessivi",
    emoji: "🔁",
    desc: "Reflexive verbs — mi sveglio, ti vesti, si diverte",
  },
  {
    href: "/study/pronomi",
    label: "Pronomi",
    emoji: "👉",
    desc: "Subject, reflexive, direct- and indirect-object pronouns",
  },
  {
    href: "/study/essere-avere",
    label: "Essere & Avere",
    emoji: "🟰",
    desc: "The two key verbs, plus avere fame / sete / sonno",
  },
  {
    href: "/study/passato-prossimo",
    label: "Passato Prossimo",
    emoji: "⏮️",
    desc: "The past tense — avere/essere + participle, irregular participles",
  },
  {
    href: "/study/articoli",
    label: "Articoli",
    emoji: "📰",
    desc: "il / lo / un / dei — definite, indefinite, partitive",
  },
  {
    href: "/study/genere",
    label: "Il Genere dei Nomi",
    emoji: "⚥",
    desc: "Masculine or feminine — endings and exceptions",
  },
  {
    href: "/study/plurali",
    label: "Il Plurale dei Nomi",
    emoji: "➕",
    desc: "Regular, spelling-change, and irregular plurals",
  },
  {
    href: "/study/aggettivi",
    label: "Gli Aggettivi",
    emoji: "🎨",
    desc: "Agreement, plus bello and buono",
  },
  {
    href: "/study/modal-verbs",
    label: "Verbi Modali",
    emoji: "🔧",
    desc: "Dovere, potere, volere — choose the right verb or form",
  },
  {
    href: "/study/concordanza",
    label: "La Concordanza",
    emoji: "🎯",
    desc: "Pick the correct adjective form to match the noun",
  },
  {
    href: "/study/piacere",
    label: "Piacere",
    emoji: "💚",
    desc: "Mi piace / mi piacciono — singular, plural, and questions",
  },
  {
    href: "/study/preposizioni-articolate",
    label: "Preposizioni Articolate",
    emoji: "🔗",
    desc: "del / al / dal / nel / sul — fill in the right form",
  },
  {
    href: "/study/ristorante",
    label: "Al Ristorante",
    emoji: "🍽️",
    desc: "Complete the restaurant conversation",
  },
  {
    href: "/study/al-bar",
    label: "Al Bar",
    emoji: "☕",
    desc: "ISC verbs and piacere translation exercises",
  },
  {
    href: "/study/possessivi",
    label: "Aggettivi Possessivi",
    emoji: "👨‍👩‍👧",
    desc: "Mio / tuo / suo — possessive adjectives with family",
  },
  {
    href: "/study/time",
    label: "Time & Dates",
    emoji: "🕐",
    desc: "Telling the time, days, months, and seasons",
  },
  {
    href: "/study/gerundio",
    label: "Il Gerundio",
    emoji: "⏳",
    desc: "-ando / -endo, stare + gerundio, and the four uses",
  },
  {
    href: "/study/descrizione",
    label: "Descrivi l'Immagine",
    emoji: "🖼️",
    desc: "Describe a picture — c'è/ci sono, colours, and positions",
  },
];

export default function FocusedDrillsPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Focused Drills</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Practice a specific topic in isolation.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {drills.map(({ href, label, emoji, desc }) => (
          <Link key={href} href={href}>
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardContent className="py-4 px-4 flex items-center gap-4">
                <div className="text-3xl">{emoji}</div>
                <div>
                  <div className="font-semibold">{label}</div>
                  <div className="text-sm text-muted-foreground">{desc}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
