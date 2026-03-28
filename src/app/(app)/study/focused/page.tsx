import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

const drills = [
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
