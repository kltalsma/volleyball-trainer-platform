import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/workout-exercises - Add exercise to workout
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      workoutId,
      exerciseId,
      order,
      duration,
      notes
    } = body

    if (!workoutId || !exerciseId || order === undefined) {
      return NextResponse.json(
        { error: "workoutId, exerciseId, and order are required" },
        { status: 400 }
      )
    }

    // Verify the workout exists and user has permission
    const workout = await prisma.workout.findUnique({
      where: { id: workoutId },
      select: { 
        id: true, 
        creatorId: true,
        teamId: true
      }
    })

    if (!workout) {
      return NextResponse.json(
        { error: "Workout not found" },
        { status: 404 }
      )
    }

    // Check if user is the creator or a team member
    if (workout.creatorId !== session.user.id) {
      if (workout.teamId) {
        const teamMember = await prisma.teamMember.findFirst({
          where: {
            teamId: workout.teamId,
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

    // Verify the exercise exists
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId }
    })

    if (!exercise) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 }
      )
    }

    // Create the workout exercise
    const workoutExercise = await prisma.workoutExercise.create({
      data: {
        workoutId,
        exerciseId,
        order,
        duration,
        notes
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

    return NextResponse.json(workoutExercise, { status: 201 })
  } catch (error) {
    console.error("Error adding exercise to workout:", error)
    return NextResponse.json(
      { error: "Failed to add exercise to workout" },
      { status: 500 }
    )
  }
}

// GET /api/workout-exercises - Get all exercises for a workout
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workoutId = searchParams.get("workoutId")

    if (!workoutId) {
      return NextResponse.json(
        { error: "workoutId is required" },
        { status: 400 }
      )
    }

    // Verify the workout exists and user has permission to view it
    const workout = await prisma.workout.findUnique({
      where: { id: workoutId },
      select: { 
        id: true, 
        creatorId: true,
        isPublic: true,
        teamId: true
      }
    })

    if (!workout) {
      return NextResponse.json(
        { error: "Workout not found" },
        { status: 404 }
      )
    }

    // Check if user has permission to view
    const hasPermission = workout.isPublic || 
                         workout.creatorId === session.user.id

    if (!hasPermission && workout.teamId) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: workout.teamId,
          userId: session.user.id
        }
      })
      
      if (!teamMember) {
        return NextResponse.json(
          { error: "You don't have permission to view this workout" },
          { status: 403 }
        )
      }
    } else if (!hasPermission) {
      return NextResponse.json(
        { error: "You don't have permission to view this workout" },
        { status: 403 }
      )
    }

    // Get workout exercises
    const workoutExercises = await prisma.workoutExercise.findMany({
      where: { workoutId },
      include: {
        exercise: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
            duration: true,
            diagram: true,
            videoUrl: true,
            tags: true,
            isPublic: true,
            creatorId: true,
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        order: "asc"
      }
    })

    // Filter out private exercises that don't belong to the current user
    // Replace them with a placeholder to maintain order
    const filteredExercises = workoutExercises.map(we => {
      const isOwner = we.exercise.creatorId === session.user.id
      const isPublicExercise = we.exercise.isPublic
      
      // If exercise is private and user doesn't own it, hide the details
      if (!isPublicExercise && !isOwner) {
        return {
          ...we,
          exercise: {
            id: we.exercise.id,
            title: "[Private Exercise]",
            description: "This exercise is private and cannot be viewed.",
            difficulty: we.exercise.difficulty,
            duration: we.exercise.duration,
            diagram: null,
            videoUrl: null,
            tags: [],
            isPublic: false,
            creatorId: we.exercise.creatorId,
            category: null
          }
        }
      }
      
      return we
    })

    return NextResponse.json({ exercises: filteredExercises })
  } catch (error) {
    console.error("Error fetching workout exercises:", error)
    return NextResponse.json(
      { error: "Failed to fetch workout exercises" },
      { status: 500 }
    )
  }
}
