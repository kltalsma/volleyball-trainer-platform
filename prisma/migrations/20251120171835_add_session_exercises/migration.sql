-- CreateTable
CREATE TABLE "session_exercises" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "duration" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "session_exercises_sessionId_idx" ON "session_exercises"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "session_exercises_sessionId_order_key" ON "session_exercises"("sessionId", "order");

-- AddForeignKey
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
