# YourSportPlanner Architecture Analysis

## How YourSportPlanner Works

### Exercise Management
- Exercises are **standalone reusable entities** in a library
- Each exercise has:
  - Name, description, images/drawings
  - Techniques and sub-techniques (filterable)
  - Required materials
  - Skill levels (beginner/intermediate/advanced)
  - Min/max player count
- Exercises can be searched and filtered
- Can be made public for sharing with other users

### Training Management
- **Trainings are scheduled instances with exercises**
- Creating a training workflow:
  1. Create training with name, date/time, teams, notes
  2. Search/filter exercises from library
  3. Add exercises directly to the training
  4. Each exercise in training has:
     - Duration (specific to this training)
     - Notes/remarks (specific to this training)
     - Order (can be reordered)
  5. Can create new exercises while building training
  6. Generate PDF for printing
  7. Mark attendance 1 hour before training

- **Key insight**: No separate "training plan/template" concept
- Trainings are BOTH scheduled AND contain exercises
- Can mark training as "public" for others to copy/reuse

## Comparison with Our Current Architecture

### Our Current Model (After Refactor)
```
Workout (Training Plan)          TrainingSession (Scheduled Training)
├── Title                        ├── Title
├── Description                  ├── ScheduledAt
├── TotalDuration               ├── Duration
└── WorkoutExercises            ├── Location
    ├── Exercise                ├── Status
    ├── Duration                ├── WorkoutId (optional - links to plan)
    └── Order                   └── Attendance records
```

### YourSportPlanner Model
```
Training (Combined Plan + Schedule)
├── Title
├── ScheduledAt (date/time)
├── Teams
├── Notes
├── Public (yes/no)
└── TrainingExercises
    ├── Exercise (from library)
    ├── Duration (specific to this training)
    ├── Notes (specific to this training)
    └── Order
```

## Key Differences

1. **No Separation**: YourSportPlanner doesn't separate templates from scheduled trainings
2. **Direct Exercise Assignment**: Exercises are added directly to scheduled trainings
3. **Public Sharing**: Trainings can be marked public for others to copy
4. **Single Creation Flow**: One workflow creates training + schedule + exercises together

## Recommendation for Our Platform

Given YourSportPlanner's approach and our current situation, I recommend a **hybrid approach**:

### Option D: Hybrid Model (New Recommendation)

**Keep both concepts but simplify the workflow:**

1. **Training Plans (`Workout`)** - Optional templates
   - Can be created standalone at `/trainings/new`
   - Can be marked as "template" for reusability
   - Acts as a blueprint with exercises

2. **Scheduled Trainings (`TrainingSession`)** - The core entity
   - Always has date/time/team
   - Can optionally link to a workout plan (copies exercises)
   - **Can have exercises managed directly** (like YourSportPlanner)
   - Supports both flows:
     - "Schedule from template" → copies workout exercises
     - "Create custom training" → add exercises directly

3. **New Features Needed**:
   - Add `SessionExercise` model (similar to `WorkoutExercise` but for sessions)
   - Allow adding/editing exercises on scheduled trainings
   - When scheduling from workout, copy exercises to session
   - Session exercises can be modified without affecting workout template

### Database Changes

```prisma
// New model for exercises in training sessions
model SessionExercise {
  id          String          @id @default(cuid())
  sessionId   String
  exerciseId  String
  order       Int
  duration    Int?            // Minutes
  notes       String?         // Session-specific notes
  createdAt   DateTime        @default(now())
  
  session     TrainingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  exercise    Exercise        @relation(fields: [exerciseId], references: [id])
  
  @@unique([sessionId, exerciseId])
  @@index([sessionId])
}
```

### Benefits
- ✅ Aligns with YourSportPlanner UX (exercises on scheduled trainings)
- ✅ Keeps template concept for coaches who want reusability
- ✅ Supports ad-hoc custom trainings (like "MB Training")
- ✅ Flexible: coaches can choose their workflow
- ✅ No breaking changes to existing workouts

### Implementation Steps
1. Create `SessionExercise` model and migration
2. Add exercise management UI to training session detail page
3. Update "Schedule Training" to copy exercises from workout if selected
4. Keep existing workout/training plan pages as template builders

## Current Issue Resolution

For the existing "MB Training" (custom training with no exercises):
- With Option D: Can now add exercises directly to it
- Maintains the flexibility coaches need
- No data loss or migration needed
