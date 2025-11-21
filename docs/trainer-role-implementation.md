# TRAINER Role Implementation - Next Steps

## What We've Done ✅

### 1. **Database Schema Updated**
- Added `TRAINER` to `MemberRole` enum in `prisma/schema.prisma` (line 104)
- Created migration file: `prisma/migrations/20251121081935_add_trainer_to_member_role/migration.sql`

### 2. **UI Components Updated**
- ✅ Added "Trainer" option to team member role dropdowns in:
  - `src/app/teams/[id]/edit/page.tsx` (lines 472, 594)
- ⏳ Role badge styling updates pending (requires Prisma client regeneration for TypeScript support)

## What Needs to Be Done After Database Setup 🔄

### 1. **Run Database Migration**
```bash
# Set your DATABASE_URL environment variable first
npx prisma migrate dev --name add_trainer_to_member_role
# or apply existing migration:
npx prisma db push
```

### 2. **Regenerate Prisma Client**
```bash
npx prisma generate
```

### 3. **Add Role Badge Styling** (After Prisma client regeneration)
Update role badge conditional styling in:

**`src/app/teams/[id]/page.tsx` (line ~444):**
```typescript
member.role === 'TRAINER' ? 'bg-orange-100 text-orange-700' :
```

**`src/app/teams/[id]/edit/page.tsx` (line ~543):**
```typescript
member.role === 'TRAINER' ? 'bg-orange-100 text-orange-700' :
```

**`src/app/admin/users/[id]/edit/page.tsx` (line ~307):**
```typescript
membership.role === 'TRAINER' ? 'bg-orange-100 text-orange-800' :
```
### 4. **Update API Permissions**
Update these files to include TRAINER in coach-level permissions:

**`src/app/api/attendance/route.ts` (line 46):**
```typescript
role: { in: ['COACH', 'TRAINER', 'ASSISTANT_COACH'] }
```

**`src/app/api/attendance/[id]/route.ts` (line 56):**
```typescript
const isCoach = ['COACH', 'TRAINER', 'ASSISTANT_COACH'].includes(teamMember.role)
```

**`src/app/api/team-members/route.ts` (line 54):**
```typescript
const isCoach = currentUserMember && (
  currentUserMember.role === "COACH" || 
  currentUserMember.role === "TRAINER" || 
  currentUserMember.role === "ASSISTANT_COACH"
)
```

**`src/app/api/team-members/route.ts` (line 80):**
```typescript
role: role === "COACH" || role === "TRAINER" || role === "ASSISTANT_COACH" ? "TRAINER" : "PLAYER"
```

**`src/app/api/team-members/[id]/route.ts` (line 56):**
```typescript
const isCoach = currentUserMember && (
  currentUserMember.role === "COACH" || 
  currentUserMember.role === "TRAINER" || 
  currentUserMember.role === "ASSISTANT_COACH"
)
```

### 5. **Test the Implementation**
1. Verify TRAINER option appears in team member dropdowns
2. Test that users with TRAINER team role have appropriate permissions
3. Verify role badge styling displays correctly

## Current Status
- ✅ Schema updated
- ✅ Migration created  
- ✅ UI updated with TRAINER option in dropdowns
- ⏳ Role styling pending
- ⏳ Database migration pending (needs DATABASE_URL)
- ⏳ Prisma client regeneration pending
- ⏳ API permission updates pending

## Color Scheme for TRAINER Role
Using **orange** theme to distinguish from other roles:
- `bg-orange-100 text-orange-700` for team pages
- `bg-orange-100 text-orange-800` for admin pages