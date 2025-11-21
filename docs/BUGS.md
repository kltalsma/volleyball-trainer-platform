# Known Bugs

## Public Library Filter Shows Private Badge

**Priority:** Medium
**Status:** Open
**Date Reported:** 2025-11-21

### Description
On the trainings page (http://localhost:3000/trainings), when selecting "Public Library" filter, trainings are displayed but their badges show "Private" status instead of "Public".

### Expected Behavior
- Public Library filter should show trainings with "Public" badge
- Private trainings filter should show trainings with "Private" badge

### Actual Behavior
- Public Library filter shows trainings but they display "Private" badge
- The filter itself seems to work (shows the correct trainings)
- The issue is with the `isPublic` flag display/badge

### Location
- Page: `/trainings` (src/app/trainings/page.tsx)
- May involve API endpoint: `/api/workouts`

### Steps to Reproduce
1. Navigate to http://localhost:3000/trainings
2. Select "Public Library" from the filter dropdown
3. Observe that trainings show "Private" badge even though they should be public

### Suggested Fix
- Check if the `isPublic` field is being queried correctly from the database
- Verify the badge rendering logic in the trainings list component
- Ensure the filter query correctly filters by `isPublic = true`
