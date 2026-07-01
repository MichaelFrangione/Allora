import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { conjugate, isItalianVerb, verbGroupOf } from "@/lib/conjugate";
import { dedupStatus } from "@/lib/vocab-dedup";
import { lookupWord } from "@/lib/dictionary";
import type { Prisma } from "@prisma/client";

// Add a looked-up word to the shared staging table. Body: { italian, english }.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const italian = typeof body?.italian === "string" ? body.italian.trim() : "";
  const english = typeof body?.english === "string" ? body.english.trim() : "";
  if (!italian) {
    return NextResponse.json({ error: "Nothing to add" }, { status: 400 });
  }

  // Dedup against static content + existing staged/promoted rows.
  const dup = await dedupStatus(italian);
  if (dup.exists) {
    return NextResponse.json(
      { error: "already-exists", where: dup.where, message: `"${italian}" is already in ${dup.where}.` },
      { status: 409 },
    );
  }

  const wikt = await lookupWord(italian);
  const verb = isItalianVerb(italian);
  const conj = verb ? conjugate(italian, { aux: wikt.aux ?? undefined }) : null;

  const entry = await prisma.vocabEntry.create({
    data: {
      italian,
      english,
      partOfSpeech: verb ? "verb" : null,
      gender: wikt.gender ?? null,
      verbGroup: verb ? verbGroupOf(italian) : null,
      conjugation: (conj ?? undefined) as Prisma.InputJsonValue | undefined,
      createdById: session.user.id,
    },
  });

  return NextResponse.json(entry);
}

// Remove a staged entry (typo/mistake). Only affects STAGED rows.
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.vocabEntry.deleteMany({ where: { id, status: "STAGED" } });
  return NextResponse.json({ ok: true });
}
