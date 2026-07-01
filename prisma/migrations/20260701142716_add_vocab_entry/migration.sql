-- CreateTable
CREATE TABLE "VocabEntry" (
    "id" TEXT NOT NULL,
    "italian" TEXT NOT NULL,
    "english" TEXT NOT NULL,
    "partOfSpeech" TEXT,
    "gender" TEXT,
    "verbGroup" TEXT,
    "conjugation" JSONB,
    "example" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'STAGED',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promotedAt" TIMESTAMP(3),

    CONSTRAINT "VocabEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VocabEntry_status_idx" ON "VocabEntry"("status");

-- AddForeignKey
ALTER TABLE "VocabEntry" ADD CONSTRAINT "VocabEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
