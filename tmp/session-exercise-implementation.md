# Session Exercise Management Implementation

## Overview
Implemented the ability to add and manage exercises directly on training sessions, aligning with YourSportPlanner's architecture while maintaining the existing training plan (Workout) concept for reusability.

## What Was Implemented

### 1. Database Model (`SessionExercise`)
- **Location**: `prisma/schema.prisma`
- **Migration**: `20251120171835_add_session_exercises`
- **Fields**:
  - `id` - Unique identifier
  - `sessionId` - Links to TrainingSession
  - `exerciseId` - Links to Exercise
  - `order` - Display order in session
  - `duration` - Session-specific duration override
  - `notes` - Session-specific notes
  - `createdAt` - Timestamp

### 2. API Endpoints

#### `/api/session-exercises` (POST, GET)
- **POST**: Add exercise to training session
  - Validates user is coach
  - Creates session exercise with order
  - Returns created exercise with details
  
- **GET**: List all exercises for a session
  - Filters private exercises
  - Returns ordered list
  - Includes exercise metadata

#### `/api/session-exercises/[id]` (PATCH, DELETE)
- **PATCH**: Update exercise order, duration, or notes
  - Permission check (coach only)
  - Partial updates supported
  
- **DELETE**: Remove exercise from session
  - Permission check (coach only)
  - Auto-reorders remaining exercises

### 3. Training Session Flow Updates

#### POST `/api/training-sessions`
Now automatically copies exercises from workout plan to session when `workoutId` is provided:
```typescript
if (workoutId) {
  const workoutExercises = await prisma.workoutExercise.findMany({
    where: { workoutId },
    orderBy: { order: 'asc' }
  })
  
  await prisma.sessionExercise.createMany({
    data: workoutExercises.map(we => ({
      sessionId: trainingSession.id,
      exerciseId: we.exerciseId,
      order: we.order,
      duration: we.duration,
      notes: we.notes
    }))
  })
}
```

#### GET endpoints now include exercises
Both GET methods updated to include `exercises` relation with exercise details.

### 4. UI Updates

#### Training Session Detail Page (`/teams/[id]/trainings/[trainingId]`)
Added new "Training Plan" section displaying:
- Numbered exercise list
- Exercise title, description, difficulty
- Duration and notes per exercise
- Clickable cards linking to exercise details
- Total duration calculation
- Only shows when exercises exist

## Architecture Benefits

### Hybrid Model Advantages
1. **Flexible Workflow**
   - Can schedule with training plan → exercises copied
   - Can schedule without plan → add exercises directly later
   - Fixes "MB Training" issue (custom trainings with no plan)

2. **Independence**
   - Session exercises are independent copies
   - Modifying session doesn't affect workout template
   - Workout plans remain reusable templates

3. **YourSportPlanner Alignment**
   - Exercises live on scheduled trainings (like YSP)
   - Maintains template concept for coaches who want it
   - Natural workflow: create/select plan → schedule → adjust for session

## Current State

### Database
- Migration applied successfully
- `session_exercises` table created
- Foreign keys and indexes in place

### Existing Data
Existing training sessions remain unchanged. When they're next viewed:
- Sessions linked to workouts: Will need to copy exercises (one-time migration opportunity)
- Custom sessions without workouts: Can now add exercises directly

### Future Sessions
All new sessions scheduled from a workout will automatically get exercises copied.

## Next Steps (Optional Enhancements)

### 1. Exercise Management UI
Add ability to:
- Add exercises to existing sessions (search/filter like workout builder)
- Reorder exercises via drag-drop
- Edit duration/notes inline
- Remove exercises

### 2. One-Time Data Migration
Script to copy exercises from workouts to existing sessions:
```typescript
// For existing sessions with workoutId but no exercises
const sessions = await prisma.trainingSession.findMany({
  where: {
    workoutId: { not: null },
    exercises: { none: {} }
  }
})

for (const session of sessions) {
  const workoutExercises = await prisma.workoutExercise.findMany({
    where: { workoutId: session.workoutId }
  })
  
  await prisma.sessionExercise.createMany({
    data: workoutExercises.map(we => ({...}))
  })
}
```

### 3. Enhanced Display
- Show exercises on team page session cards
- Add exercise count to session list
- PDF export including exercises

## Files Modified

### Database
- `prisma/schema.prisma` - Added SessionExercise model
- `prisma/migrations/20251120171835_add_session_exercises/migration.sql`

### API Routes
- `src/app/api/session-exercises/route.ts` (NEW)
- `src/app/api/session-exercises/[id]/route.ts` (NEW)
- `src/app/api/training-sessions/route.ts` (UPDATED)

### UI
- `src/app/teams/[id]/trainings/[trainingId]/page.tsx` (UPDATED)

## Testing Checklist

- [x] Database migration successful
- [x] Prisma client regenerated
- [ ] Create new training session from workout → exercises copied
- [ ] View training session detail → exercises displayed
- [ ] Create custom training without workout → no errors
- [ ] API endpoints respond correctly
- [ ] Permission checks work (coach only)

## Known Issues / Limitations

1. **No UI for adding exercises yet**
   - Can copy from workout on creation
   - Direct addition UI needs to be built (like workout edit page)

2. **Existing sessions not migrated**
   - Need one-time script or manual trigger
   - Sessions with workouts don't show exercises yet

3. **No reordering UI**
   - API supports PATCH for order changes
   - Drag-drop interface not yet implemented
