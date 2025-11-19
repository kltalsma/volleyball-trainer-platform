# Add Exercise to Training Feature

## Overview
Implemented a feature that allows users to add exercises directly to trainings from the exercise detail page.

## Implementation Details

### New Files Created
1. **`src/components/add-to-training-button.tsx`**
   - Client component with modal dialog
   - Lists all available trainings
   - Allows customizing duration and adding notes
   - Option to create a new training with pre-selected exercise

### Modified Files
1. **`src/app/exercises/[id]/page.tsx`**
   - Added `AddToTrainingButton` component to header
   - Button visible to all users (not just creators)

2. **`src/app/trainings/new/page.tsx`**
   - Added support for `?exerciseId=xxx` URL parameter
   - Auto-adds exercise to training when coming from exercise page

## User Flow

### Option 1: Add to Existing Training
1. User views an exercise detail page
2. Clicks "➕ Add to Training" button
3. Modal opens showing:
   - Exercise name being added
   - Dropdown to select existing training
   - Duration field (pre-filled from exercise default)
   - Optional notes field
4. User selects a training and clicks "Add to Training"
5. Exercise is added to the end of the selected training
6. User is redirected to the training detail page

### Option 2: Create New Training with Exercise
1. User views an exercise detail page
2. Clicks "➕ Add to Training" button
3. Clicks "Create New Training" in modal
4. Redirected to training creation page with exercise pre-selected
5. Exercise appears in the exercises section automatically
6. User completes training creation

## Technical Implementation

### Order Management
- Fetches existing exercises for selected training
- Calculates max order value
- Adds new exercise at `maxOrder + 1`

### API Endpoints Used
- `GET /api/workouts` - Fetch available trainings
- `GET /api/workout-exercises?workoutId=xxx` - Get existing exercises (for order)
- `POST /api/workout-exercises` - Add exercise to training

### Permissions
- Uses existing workout-exercises API permission checks
- User must be creator or team member to add exercises

## Testing Checklist
- [ ] Open exercise detail page
- [ ] Click "Add to Training" button
- [ ] Verify modal opens and shows trainings list
- [ ] Select a training
- [ ] Modify duration and add notes
- [ ] Click "Add to Training"
- [ ] Verify redirect to training detail
- [ ] Verify exercise appears at end of exercise list
- [ ] Test "Create New Training" button
- [ ] Verify exercise is pre-selected on training creation page

## Branch
- **Branch name**: `feature/add-exercise-to-training`
- **Based on**: `feature/attendance-tracking`
- **Commits**: 2 commits
  1. Add debug logging for training creation dropdown
  2. Add exercise to training feature with modal and pre-selection support
