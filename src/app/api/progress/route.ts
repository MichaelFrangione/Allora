import { auth } from "@/lib/auth";
import { getModeStats, getWeakItems } from "@/lib/progress";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [modeStats, weakItems] = await Promise.all([
    getModeStats(session.user.id),
    getWeakItems(session.user.id),
  ]);

  return NextResponse.json({ modeStats, weakItems });
}
