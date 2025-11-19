import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH /api/workout-exercises/[id] - Update a workout exercise
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { order, duration, notes } = body

    // Get the workout exercise with workout info
    const workoutExercise = await prisma.workoutExercise.findUnique({
      where: { id },
      include: {
        workout: {
          select: {
            creatorId: true,
            teamId: true
          }
        }
      }
    })

    if (!workoutExercise) {
      return NextResponse.json(
        { error: "Workout exercise not found" },
        { status: 404 }
      )
    }

    // Check if user has permission
    if (workoutExercise.workout.creatorId !== session.user.id) {
      if (workoutExercise.workout.teamId) {
        const teamMember = await prisma.teamMember.findFirst({
          where: {
            teamId: workoutExercise.workout.teamId,
            userId: session.user.id
          }
        })
        
        if (!teamMember) {
          return NextResponse.json(
            { error: "You don't have permission to modify this workout" },
            { status: 403 }
          )
        }
      } else {
        return NextResponse.json(
          { error: "You don't have permission to modify this workout" },
          { status: 403 }
        )
      }
    }

    // Update the workout exercise
    const updated = await prisma.workoutExercise.update({
      where: { id },
      data: {
        ...(order !== undefined && { order }),
        ...(duration !== undefined && { duration }),
        ...(notes !== undefined && { notes })
      },
      include: {
        exercise: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
            duration: true
          }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating workout exercise:", error)
    return NextResponse.json(
      { error: "Failed to update workout exercise" },
      { status: 500 }
    )
  }
}

// DELETE /api/workout-exercises/[id] - Remove exercise from workout
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get the workout exercise with workout info
    const workoutExercise = await prisma.workoutExercise.findUnique({
      where: { id },
      include: {
        workout: {
          select: {
            id: true,
            creatorId: true,
            teamId: true
          }
        }
      }
    })

    if (!workoutExercise) {
      return NextResponse.json(
        { error: "Workout exercise not found" },
        { status: 404 }
      )
    }

    // Check if user has permission
    if (workoutExercise.workout.creatorId !== session.user.id) {
      if (workoutExercise.workout.teamId) {
        const teamMember = await prisma.teamMember.findFirst({
          where: {
            teamId: workoutExercise.workout.teamId,
            userId: session.user.id
          }
        })
        
        if (!teamMember) {
          return NextResponse.json(
            { error: "You don't have permission to modify this workout" },
            { status: 403 }
          )
        }
      } else {
        return NextResponse.json(
          { error: "You don't have permission to modify this workout" },
          { status: 403 }
        )
      }
    }

    // Delete the workout exercise
    await prisma.workoutExercise.delete({
      where: { id }
    })

    // Reorder remaining exercises
    const remainingExercises = await prisma.workoutExercise.findMany({
      where: { workoutId: workoutExercise.workout.id },
      orderBy: { order: "asc" }
    })

    // Update orders to be sequential
    await Promise.all(
      remainingExercises.map((ex, index) =>
        prisma.workoutExercise.update({
          where: { id: ex.id },
          data: { order: index + 1 }
        })
      )
    )

    return NextResponse.json({ message: "Exercise removed successfully" })
  } catch (error) {
    console.error("Error deleting workout exercise:", error)
    return NextResponse.json(
      { error: "Failed to remove exercise from workout" },
      { status: 500 }
    )
  }
}
