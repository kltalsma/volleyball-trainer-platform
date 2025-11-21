# Multiple Roles Per User on Team - Implementation

**Date**: November 21, 2025
**Feature**: Allow users to have multiple roles on the same team

## Problem Statement

Previously, a user could only have ONE role per team due to a database constraint:
```prisma
@@unique([teamId, userId])
```

This meant if someone was a TRAINER, they couldn't also be a COACH for the same team.

## Solution

Changed the unique constraint to:
```prisma
@@unique([teamId, userId, role])
```

This allows:
- ✅ A user can be both TRAINER and COACH on the same team
- ✅ A user can have multiple different roles on the same team
- ✅ A user cannot have the same role twice (no duplicate COACH entries)

## Implementation Details

### Database Schema Change
**File**: `prisma/schema.prisma`
- Modified the `TeamMember` model's unique constraint
- Changed from `[teamId, userId]` to `[teamId, userId, role]`

### Migration
- Applied using `npx prisma db push --accept-data-loss`
- Regenerated Prisma Client automatically

## Usage Example

Now you can:
1. Add "Maarten" as TRAINER to team "XC1"
2. Also add "Maarten" as COACH to team "XC1"
3. Both roles will exist simultaneously

## UI Considerations

The current UI still shows one role per row. Future enhancements could:
- Group multiple roles for the same user
- Show badges for all roles a user has
- Allow multi-select when adding users to teams

## Technical Notes

- Multiple `TeamMember` records will exist for the same user on the same team
- Each record has a different `role` value
- Jersey numbers and positions are per-role (might want to consolidate this in the future)
- API endpoints and queries will return multiple records for users with multiple roles

## Testing Recommendations

1. Add a user as TRAINER to a team
2. Add the same user as COACH to the same team
3. Verify both roles appear in the team members list
4. Verify permissions work correctly for both roles
5. Test removing one role doesn't affect the other role

## Future Enhancements

1. **UI Grouping**: Group multiple roles for the same user in one row
2. **Multi-select**: Allow selecting multiple roles when adding a user
3. **Role Management**: Easier way to add/remove specific roles
4. **Permission Logic**: Update permission checks to handle multiple roles
5. **Consolidate Fields**: Jersey number/position should be user-level, not role-level

---
**Status**: ✅ Completed and deployed to database
