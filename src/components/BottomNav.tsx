"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, BarChart2, BookMarked, GraduationCap, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/learn", label: "Learn", icon: GraduationCap },
  { href: "/vocab", label: "Vocab", icon: BookOpen },
  { href: "/add", label: "Add", icon: PlusCircle },
  { href: "/grammar", label: "Guide", icon: BookMarked },
  { href: "/progress", label: "Progress", icon: BarChart2 },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-border bg-background/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all min-w-[56px]",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn("h-5 w-5 transition-transform", active && "scale-110")}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={cn("text-[10px]", active ? "font-extrabold" : "font-medium")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
