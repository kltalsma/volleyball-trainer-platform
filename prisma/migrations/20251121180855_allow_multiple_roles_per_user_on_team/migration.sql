-- Drop the old unique constraint on (teamId, userId)
ALTER TABLE "team_members" DROP CONSTRAINT IF EXISTS "TeamMember_teamId_userId_key";

-- Drop old indexes if they exist
DROP INDEX IF EXISTS "team_members_teamId_userId_key";
DROP INDEX IF EXISTS "team_members_teamId_userId_role_key";

-- Create new unique constraint on (teamId, userId, role)
ALTER TABLE "team_members" ADD CONSTRAINT "TeamMember_teamId_userId_role_key" 
  UNIQUE ("teamId", "userId", "role");
