-- Drop the old unique constraint on (teamId, userId)
DROP INDEX IF EXISTS "team_members_teamId_userId_key";

-- Create new unique constraint on (teamId, userId, role)
CREATE UNIQUE INDEX "team_members_teamId_userId_role_key" ON "team_members"("teamId", "userId", "role");
