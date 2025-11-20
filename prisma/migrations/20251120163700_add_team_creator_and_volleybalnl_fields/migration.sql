/*
  Warnings:

  - Added the required column `creatorId` to the `teams` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "creatorId" TEXT NOT NULL,
ADD COLUMN     "volleybalNlApiId" TEXT,
ADD COLUMN     "volleybalNlCategory" TEXT,
ADD COLUMN     "volleybalNlClubId" TEXT,
ADD COLUMN     "volleybalNlTeamNumber" INTEGER;

-- AlterTable
ALTER TABLE "workouts" ADD COLUMN     "diagram" TEXT;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
