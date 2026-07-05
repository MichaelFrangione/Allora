import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { DRILLS } from "@/lib/drills";

// Custom study modes that belong in this list but aren't registry drills.
const customDrills = [
  {
    href: "/study/time",
    label: "Time & Dates",
    emoji: "🕐",
    desc: "Telling the time, days, months, and seasons",
  },
  {
    href: "/study/descrizione",
    label: "Descrivi l'Immagine",
    emoji: "🖼️",
    desc: "Describe a picture — c'è/ci sono, colours, and positions",
  },
];

const drills = [
  ...DRILLS.map((d) => ({
    href: `/study/${d.slug}`,
    label: d.title,
    emoji: d.emoji,
    desc: d.desc,
  })),
  ...customDrills,
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
