# Future Features

## Multiple Global Roles Per User

**Priority:** Medium
**Status:** Planned
**Date Requested:** 2025-11-21

### Description
Users should be able to have multiple global roles (e.g., both TRAINER and ADMIN). Currently, a user can only have one global role but can have multiple team-specific roles.

### Current Behavior
- Users have one global role: ADMIN, TRAINER, or PLAYER (stored in `role` field)
- Users can have multiple team-specific roles (COACH, TRAINER, ASSISTANT_COACH, PLAYER per team)
- Display shows: "Maarten Opm" with "🏃 TRAINER" badge

### Desired Behavior
- Users should have multiple global roles
- Display should show: "Maarten Opm" with badges "COACH" "TRAINER"
- Example: A user could be both TRAINER (can create exercises/workouts) and ADMIN (system administration)

### Implementation Plan

#### 1. Database Schema Changes
```prisma
model User {
  // Keep single role for backward compatibility
  role  UserRole   @default(TRAINER) // Deprecated
  roles UserRole[] @default([TRAINER]) // New: array of roles
  ...
}
```

#### 2. Migration Strategy
- Add `roles` array field with default value based on existing `role`
- Data migration: Copy existing `role` value into `roles` array
- Update all code to read from `roles` instead of `role`
- Keep `role` field for backward compatibility (can be removed in future version)

#### 3. Code Changes Required

**API Changes:**
- `/api/admin/users/[id]/route.ts` - Accept/save multiple roles
- Auth checks across all endpoints - Check if user has ANY required role

**UI Changes:**
- `src/app/admin/users/[id]/edit/page.tsx` - Multi-select for roles instead of dropdown
- `src/app/admin/users/page.tsx` - Display multiple role badges
- `src/app/dashboard/page.tsx` - Show multiple roles in user info
- All role badge displays - Show array of roles

**Auth/Permission Updates:**
- `src/lib/auth.ts` - Update session to include roles array
- `src/middleware.ts` - Check if user has any required role
- Update all permission checks: `user.role === 'ADMIN'` → `user.roles.includes('ADMIN')`

#### 4. UI Component for Role Selection
```tsx
// Multi-select checkbox group
<div className="space-y-2">
  <label>
    <input type="checkbox" name="roles" value="PLAYER" /> 👤 Player
  </label>
  <label>
    <input type="checkbox" name="roles" value="TRAINER" /> 🏃 Trainer
  </label>
  <label>
    <input type="checkbox" name="roles" value="ADMIN" /> 👑 Admin
  </label>
</div>
```

#### 5. Role Badge Display
```tsx
// Show multiple badges
{user.roles.map(role => (
  <span key={role} className="badge">{role}</span>
))}
```

### Benefits
- More flexible permission system
- Users who are both trainers and admins don't need separate accounts
- Better reflects real-world scenarios (e.g., head coach who is also system admin)

### Considerations
- **Breaking Change**: Requires careful migration to avoid data loss
- **Permission Logic**: Need to define clearly what multiple roles mean
  - Is it OR logic (has ANY of these roles)?
  - Are there conflicting permissions?
- **Database**: PostgreSQL supports arrays natively, SQLite needs workaround
- **Backward Compatibility**: Keep single `role` field during transition period

### Related Work
- Team-specific multiple roles already implemented (TeamMember model)
- Can learn from that implementation for global roles

### Dependencies
- Requires database migration (needs production DATABASE_URL)
- Should be done during maintenance window
- Thorough testing required for all permission checks

### Estimated Effort
- Schema change: 1 hour
- Migration script: 2 hours
- Code updates: 4-6 hours
- Testing: 3-4 hours
- **Total: ~10-13 hours**

### Alternative (Quick Fix)
Instead of implementing true multiple global roles, we could:
1. Add a "Primary Role" concept (what's shown in the header)
2. Derive permissions from team roles (if user is TRAINER on any team, they can create exercises)
3. Keep ADMIN as the only special global role

This would give 90% of the benefit with 10% of the work.
