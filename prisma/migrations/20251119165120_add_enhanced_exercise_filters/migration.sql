-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MemberRole" ADD VALUE 'PARENT';
ALTER TYPE "MemberRole" ADD VALUE 'VOLUNTEER';

-- AlterTable
ALTER TABLE "exercises" ADD COLUMN     "materials" JSONB,
ADD COLUMN     "playerMax" INTEGER,
ADD COLUMN     "playerMin" INTEGER,
ADD COLUMN     "skillLevel" "SkillLevel",
ADD COLUMN     "techniques" TEXT[] DEFAULT ARRAY[]::TEXT[];
