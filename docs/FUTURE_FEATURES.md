# Future Features

## Read-Only Cross-Team Viewing

### Problem
Currently, users can only view teams where they have a specific role (COACH, ASSISTANT_COACH, or PLAYER). When a user is removed from COACH role (even if they're the team creator), they lose all access to view team information.

### Use Case
A trainer/coach who works with one team should be able to view information from other teams within the same organization for reference purposes:
- View other teams' players/trainers
- View other teams' training sessions
- View other teams' exercises
- **WITHOUT** being able to modify any information

### Proposed Solution

#### Option 1: Organization-Level Access
- Add `Organization` model
- Teams belong to organizations
- Users with `MEMBER` role in organization get read-only access to all teams
- ADMIN users get read-only access to all teams by default

#### Option 2: New MemberRole - VIEWER
- Add `VIEWER` to `MemberRole` enum
- `VIEWER` role grants read-only access to team information
- Can be assigned per-team or organization-wide

#### Option 3: Permission System
- Implement granular permission system
- Separate "view" from "edit" permissions
- Allow flexible permission assignments

### Priority
Medium - Not blocking core functionality, but improves usability for multi-team organizations

### Related Issues
- Team creators can't view their own created teams if not assigned as COACH/PLAYER
- Cross-team collaboration is currently impossible
- Coaches can't reference other teams' training plans

### Notes
- Must ensure no accidental data modification
- Should work with existing role-based access control
- Consider privacy implications (some teams may want to be private)
