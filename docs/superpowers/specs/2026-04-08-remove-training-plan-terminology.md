# Spec: Remove "Training Plan" Terminology

**Date:** 2026-04-08
**Status:** Approved
**Approach:** Option A — UI naming cleanup only

## Problem

The app uses inconsistent terminology. The underlying Prisma model is `Workout`, the URL routes are `/trainings`, but some UI labels say "Training Plans" or "Training Plan". This creates confusion — it implies a two-step workflow (create a plan, then schedule it) that doesn't actually exist.

## Decision

A **Training** is a single concept: a set of exercises optionally scheduled for a specific date and team. There is no separate "Training Plan" concept in the UI.

## Scope

UI label changes only. No schema changes, no API route changes, no DB migrations.

## Changes

| File | Line | From | To |
|------|------|------|----|
| `src/app/dashboard/page.tsx` | 389 | `📋 Training Plans` | `📋 Trainings` |
| `src/app/trainings/[id]/page.tsx` | 296 | `Training Plan` (section heading) | `Exercises` |
| `src/app/trainings/[id]/page.tsx` | 302 | `your training plan` (EmptyState description) | `this training` |

## Out of Scope

- Renaming `Workout` model in Prisma schema (future task if desired)
- Renaming `/api/workouts` routes (future task)
- Attendance tracking via `TrainingSession` (not needed for current use case)
- Any functional changes to training creation, editing, or exercise picker
