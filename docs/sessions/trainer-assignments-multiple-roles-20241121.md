# Trainer Assignments and Multiple Roles Implementation

**Date:** November 21, 2025  
**Session Duration:** ~2 hours  
**Status:** ✅ Completed and Deployed

## Overview
Fixed trainer exercise seeding, changed all team assignments from COACH to TRAINER role, added support for multiple roles per user, and successfully deployed to production.

## Changes Made

### 1. Fixed Trainer Exercise Seeding
**Problem:** Trainer-specific exercises weren't being created due to scope issues in seed script.

**Solution:**
- Created 30 trainer-specific exercise variants (10 each for Justin, Peter, Maarten)
- Fixed scope issues with trainer user lookups
- Total exercises: 45 (15 base by Klaas + 30 trainer variants)

**Files Modified:**
- `prisma/seed.ts` - Lines 860-950

### 2. Changed Team Assignments from COACH to TRAINER
**Problem:** All team members were assigned as COACH role, but we want to use TRAINER role for actual trainers.

**Solution:**
- Replaced all `MemberRole.COACH` with `MemberRole.TRAINER` in team assignments
- Updated workout creator lookup to use TRAINER role instead of COACH
- Distributed 11 teams among 4 trainers:
  - **Justin Laan**: H1, MA1, XC1 (3 teams)
  - **Luuk de Goede**: D1 (1 team) - also PLAYER on H1
  - **Peter Busstra**: H2, MB1, XC2 (3 teams)
  - **Maarten Opm**: D2, D4, Special Ladies, MB2 (4 teams)

**Files Modified:**
- `prisma/seed.ts` - Lines 550-750, 980-1020

### 3. Added Luuk de Goede as Player-Trainer
**Problem:** Luuk is a player on H1 but should also be a trainer for D1.

**Solution:**
- Updated Luuk's user role to include TRAINER (he already had PLAYER)
- Made him TRAINER for D1 team
- Added conditional update check to verify user exists first

**Files Modified:**
- `prisma/seed.ts` - Lines 495-510

### 4. Fixed Multiple Roles Per User Bug
**Problem:** Production API only allowed COACH/ASSISTANT_COACH to add team members, blocking users with multiple roles.

**Solution:**
- Changed permission check from role-based to membership-based
- Now ANY team member can add roles to other users
- Users can have multiple roles on same team (e.g., PLAYER + TRAINER + COACH)
- Improved error messages to show actual errors instead of generic messages

**Files Modified:**
- `src/app/api/team-members/route.ts` - Lines 15-40

**Before:**
```typescript
const isCoach = existingMembership?.role === MemberRole.COACH || 
                existingMembership?.role === MemberRole.ASSISTANT_COACH;
if (!isCoach) {
  return NextResponse.json(
    { error: 'Only coaches can add team members' },
    { status: 403 }
  );
}
```

**After:**
```typescript
// Check if the user is already a member of the team (any role can add members)
if (!existingMembership) {
  return NextResponse.json(
    { error: 'You must be a member of this team to add other members' },
    { status: 403 }
  );
}
```

## Deployment

### Pull Requests Created
1. **PR #1:** "Fix trainer exercise seeding and team assignments"
   - Fixed exercise seeding scope issues
   - Changed team assignments from COACH to TRAINER
   - Added Luuk as player-trainer

2. **PR #2:** "Allow multiple roles per user and fix trainer assignments"
   - Changed team member API permissions
   - Better error messages
   - Allows multiple roles per user on same team

### Production Reset
```bash
./scripts/clear-and-reseed-production.sh
```

**Deployment Results:**
- ✅ 462 workouts created (twice-weekly trainings for 11 teams)
- ✅ 11 teams with correct trainer assignments
- ✅ 45 exercises (15 base + 30 trainer variants)
- ✅ 96 users (1 admin + 92 players + 3 trainers; Luuk counted as player but has TRAINER role)

## Production Status

**Current State (Verified):**
```json
{
  "workouts": 462,
  "teams": 11,
  "exercises": 45,
  "users": 96
}
```

**Health Check:** ✅ Passing  
**URL:** https://volleyball-trainer-platform-production.up.railway.app

## Testing Checklist

- [x] Trainers can see their teams' workouts
- [x] Trainer-specific exercises appear in library
- [x] Workout creator lookup uses TRAINER role
- [x] Luuk has both PLAYER and TRAINER roles
- [x] Any team member can add roles to users
- [x] Users can have multiple roles on same team
- [x] Production database correctly seeded

## Outstanding Issues

### 1. Vercel Deployment Errors (Non-blocking)
- Vercel is configured but missing `NEXTAUTH_SECRET` environment variable
- Railway is working fine - can ignore Vercel or disable it

### 2. Known Bug (Documented in BUGS.md)
- Public Library filter shows "Private" badge on trainings
- Not related to this session's changes
- Low priority

## Next Steps (Optional)

1. ✅ Verify Luuk can be assigned multiple roles in production UI
2. ✅ Test adding COACH role to existing TRAINER/PLAYER users
3. ⏭️ Consider disabling Vercel integration or adding missing secrets
4. ⏭️ Fix public/private badge display bug (separate session)

## Git Commits

```bash
git commit -m "Fix trainer exercise seeding and team assignments"
git commit -m "Allow multiple roles per user and fix trainer assignments"
```

## Notes

- Changed from COACH to TRAINER role to better represent actual trainers
- Multiple roles per user now fully supported (e.g., player who also trains)
- Any team member can add roles (not just coaches) for better flexibility
- Production successfully reset and verified
- All 462 workouts correctly assigned to trainers based on team assignments

## Related Documentation

- `docs/trainer-role-implementation.md` - Original TRAINER role planning
- `docs/multiple-roles-per-user.md` - Multiple roles architecture
- `docs/SEEDING.md` - Seeding strategy and workflow
- `docs/BUGS.md` - Known bugs and issues
