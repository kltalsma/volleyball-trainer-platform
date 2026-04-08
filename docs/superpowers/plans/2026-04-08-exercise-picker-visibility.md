# Exercise Picker Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trainers and admins can see all exercises in the training edit picker (not just public + own), and a "Create New Exercise" button appears at the bottom of the picker so users don't have to navigate away.

**Architecture:** Two changes. (1) The `GET /api/exercises` route currently limits non-admin/non-owner results to `isPublic: true`. We relax this so TRAINER and ADMIN roles see all exercises (same philosophy as `34ac0c3` relaxed workout access). (2) The exercise picker UI in `trainings/[id]/edit/page.tsx` gets a "Create New Exercise" link at the bottom that opens `/exercises/new` and returns the user back to the edit page via a `returnTo` query param handled on the new exercise page.

**Tech Stack:** Next.js 16 App Router, Prisma, TypeScript, Tailwind CSS

---

### Task 1: Relax exercise API visibility for TRAINER and ADMIN roles

**Files:**
- Modify: `src/app/api/exercises/route.ts:29-38`

**Context:** Currently the `where` clause is:
```ts
const where: any = {
  OR: [
    { isPublic: true },
    { creatorId: session.user.id }
  ]
}
if (myExercises) {
  where.creatorId = session.user.id
  delete where.OR
}
```
TRAINER and ADMIN users need to see all exercises (no OR filter) unless they explicitly request `myExercises=true`.

The session user role is available at `session.user.role` (a string: `'ADMIN'`, `'TRAINER'`, or `'PLAYER'`).

- [ ] **Step 1: Update the where clause in `src/app/api/exercises/route.ts`**

Replace lines 29-38 with:

```ts
    const isPrivileged = session.user.role === 'ADMIN' || session.user.role === 'TRAINER'

    const where: any = isPrivileged
      ? {} // TRAINER and ADMIN see all exercises
      : {
          OR: [
            { isPublic: true },
            { creatorId: session.user.id }
          ]
        }

    if (myExercises) {
      where.creatorId = session.user.id
      delete where.OR
    }
```

- [ ] **Step 2: Verify the session user type includes `role`**

Check `src/lib/auth.ts` or `src/types/next-auth.d.ts` to confirm `session.user.role` is typed and populated. If not, add it.

Run:
```bash
grep -r "session.user.role\|role.*session\|UserRole" src/lib/auth.ts src/types/ 2>/dev/null | head -20
```

If `role` is missing from the session type, add it following the existing pattern for `id` or `email` extension.

- [ ] **Step 3: Manual smoke test**

With the dev server running (`DATABASE_URL=... npm run dev`):
```bash
# As kltalsma@gmail.com (ADMIN) - should return all 45 seeded exercises
curl -s -b cookies.txt http://localhost:3000/api/exercises?limit=200 | jq '.pagination.total'
```
Expected: a number > 0 (45 from seed).

_(Note: for a quick functional check, log in via the browser as `justin.laan@opmheerenveen.nl` / `password123`, open DevTools Network tab, navigate to a training edit page, and check the `/api/exercises?limit=100` response — it should now return exercises.)_

---

### Task 2: Add "Create New Exercise" button to the training edit exercise picker

**Files:**
- Modify: `src/app/trainings/[id]/edit/page.tsx:540-576`

**Context:** The exercise picker is rendered at lines 540-576. After the list of exercises (or when the list is empty), we add a link that:
- Navigates to `/exercises/new`
- Passes `returnTo=/trainings/[workoutId]/edit` as a query param so the new-exercise page can redirect back after creation

The `unwrappedParams.id` holds the workout/training ID.

- [ ] **Step 1: Add a search input and "Create New Exercise" button to the picker**

Replace the exercise picker block (lines 540-576 in `src/app/trainings/[id]/edit/page.tsx`) with:

```tsx
            {/* Exercise Picker */}
            {showExercisePicker && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Select an exercise:</h3>
                  <Link
                    href={`/exercises/new?returnTo=/trainings/${unwrappedParams.id}/edit`}
                    className="text-sm px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    + Create New
                  </Link>
                </div>
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {availableExercises
                    .filter(ex => !workoutExercises.find(we => we.exerciseId === ex.id))
                    .filter(ex =>
                      !exerciseSearch ||
                      ex.title.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
                      (ex.category?.name || '').toLowerCase().includes(exerciseSearch.toLowerCase())
                    )
                    .map((exercise) => (
                      <button
                        key={exercise.id}
                        type="button"
                        onClick={() => { addExercise(exercise); setExerciseSearch('') }}
                        className="w-full text-left p-3 bg-white rounded-lg border hover:border-blue-300 hover:shadow-sm transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{exercise.title}</h4>
                            {exercise.category && (
                              <p className="text-sm text-gray-500">{exercise.category.name}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {exercise.duration && <span>⏱️ {exercise.duration}min</span>}
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              exercise.difficulty === 'EASY' ? 'bg-green-100 text-green-700' :
                              exercise.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {exercise.difficulty}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  {availableExercises.filter(ex => !workoutExercises.find(we => we.exerciseId === ex.id)).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      All exercises already added to this training.
                    </p>
                  )}
                </div>
              </div>
            )}
```

- [ ] **Step 2: Add `exerciseSearch` state and `Link` import**

At the top of the file, ensure `Link` is imported:
```ts
import Link from "next/link"
```

Add the state variable near the other `useState` declarations (around line 53):
```ts
const [exerciseSearch, setExerciseSearch] = useState('')
```

- [ ] **Step 3: Increase the exercise fetch limit to 200**

In `fetchAvailableExercises` (around line 114-124), change:
```ts
const response = await fetch("/api/exercises?limit=100")
```
to:
```ts
const response = await fetch("/api/exercises?limit=200")
```

---

### Task 3: Handle `returnTo` redirect on the new exercise page

**Files:**
- Modify: `src/app/exercises/new/page.tsx`

**Context:** After a user creates an exercise via `/exercises/new?returnTo=/trainings/[id]/edit`, the form currently navigates to `/exercises/[id]` on success. We need to check for `returnTo` and redirect there instead.

- [ ] **Step 1: Read `returnTo` param and redirect after creation**

In `src/app/exercises/new/page.tsx`, find the `useSearchParams` or router logic near the top. Add:

```ts
const searchParams = useSearchParams()
const returnTo = searchParams.get('returnTo')
```

Then in the success handler (the `router.push('/exercises/' + exercise.id)` line), replace with:

```ts
if (returnTo) {
  router.push(returnTo)
} else {
  router.push(`/exercises/${exercise.id}`)
}
```

- [ ] **Step 2: Verify `useSearchParams` is already imported**

Check the imports at the top of `src/app/exercises/new/page.tsx`. If `useSearchParams` is not imported, add it:
```ts
import { useSearchParams } from "next/navigation"
```

And ensure the component is wrapped in a `Suspense` boundary if Next.js requires it (check if other pages using `useSearchParams` do this — follow their pattern).

---

### Self-Review Checklist

- [x] Task 1 covers: TRAINER/ADMIN see all exercises in GET /api/exercises
- [x] Task 2 covers: picker shows existing exercises + search + "Create New" button
- [x] Task 3 covers: returnTo redirect after exercise creation
- [x] No TBD/TODO placeholders
- [x] `exerciseSearch` state added before use
- [x] `Link` import verified before use
- [x] `useSearchParams` import verified before use
- [x] Limit bumped to 200 to cover all seeded exercises
