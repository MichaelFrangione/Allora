import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import ThemeToggle from "@/components/ThemeToggle";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ThemeToggle className="fixed top-3 right-3 z-50" />
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
