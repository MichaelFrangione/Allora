import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { sessionId, contentId, contentType, correct, answer } = body;

  if (!contentId || !contentType || typeof correct !== "boolean") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (sessionId) {
    const owns = await prisma.studySession.findFirst({
      where: { id: sessionId, userId: session.user.id },
      select: { id: true },
    });
    if (!owns) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const attempt = await prisma.cardAttempt.create({
    data: {
      userId: session.user.id,
      sessionId: sessionId ?? null,
      contentId,
      contentType,
      correct,
      answer: answer ?? null,
    },
  });

  return NextResponse.json(attempt);
}
