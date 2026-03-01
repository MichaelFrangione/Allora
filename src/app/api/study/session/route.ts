import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action, sessionId, mode } = body;

  if (action === "start") {
    if (!mode) return NextResponse.json({ error: "Missing mode" }, { status: 400 });
    const newSession = await prisma.studySession.create({
      data: { userId: session.user.id, mode },
    });
    return NextResponse.json(newSession);
  }

  if (action === "end") {
    if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    const updated = await prisma.studySession.update({
      where: { id: sessionId, userId: session.user.id },
      data: { endedAt: new Date() },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
