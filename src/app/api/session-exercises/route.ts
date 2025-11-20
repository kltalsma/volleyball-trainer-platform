import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/session-exercises - Add exercise to training session
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      sessionId,
      exerciseId,
      order,
      duration,
      notes
    } = body

    if (!sessionId || !exerciseId || order === undefined) {
      return NextResponse.json(
        { error: "sessionId, exerciseId, and order are required" },
        { status: 400 }
      )
    }

    // Verify the training session exists and user has permission
    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      select: { 
        id: true, 
        teamId: true,
        team: {
          select: {
            id: true,
            members: {
              where: {
                userId: session.user.id,
                role: { in: ['COACH', 'ASSISTANT_COACH'] }
              }
            }
          }
        }
      }
    })

    if (!trainingSession) {
      return NextResponse.json(
        { error: "Training session not found" },
        { status: 404 }
      )
    }

    // Check if user is a coach of the team
    if (trainingSession.team.members.length === 0) {
      return NextResponse.json(
        { error: "You must be a coach to modify this training session" },
        { status: 403 }
      )
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

    // Create the session exercise
    const sessionExercise = await prisma.sessionExercise.create({
      data: {
        sessionId,
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
            duration: true,
            diagram: true,
            videoUrl: true
          }
        }
      }
    })

    return NextResponse.json(sessionExercise, { status: 201 })
  } catch (error) {
    console.error("Error adding exercise to session:", error)
    return NextResponse.json(
      { error: "Failed to add exercise to session" },
      { status: 500 }
    )
  }
}

// GET /api/session-exercises - Get all exercises for a training session
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      )
    }

    // Verify the training session exists and user has permission to view it
    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      select: { 
        id: true, 
        teamId: true,
        team: {
          select: {
            id: true,
            members: {
              where: {
                userId: session.user.id
              }
            }
          }
        }
      }
    })

    if (!trainingSession) {
      return NextResponse.json(
        { error: "Training session not found" },
        { status: 404 }
      )
    }

    // Check if user is a member of the team
    if (trainingSession.team.members.length === 0) {
      return NextResponse.json(
        { error: "You don't have permission to view this training session" },
        { status: 403 }
      )
    }

    // Get session exercises
    const sessionExercises = await prisma.sessionExercise.findMany({
      where: { sessionId },
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
            techniques: true,
            playerMin: true,
            playerMax: true,
            skillLevel: true,
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
    const filteredExercises = sessionExercises.map(se => {
      const isOwner = se.exercise.creatorId === session.user.id
      const isPublicExercise = se.exercise.isPublic
      
      // If exercise is private and user doesn't own it, hide the details
      if (!isPublicExercise && !isOwner) {
        return {
          ...se,
          exercise: {
            id: se.exercise.id,
            title: "[Private Exercise]",
            description: "This exercise is private and cannot be viewed.",
            difficulty: se.exercise.difficulty,
            duration: se.exercise.duration,
            diagram: null,
            videoUrl: null,
            tags: [],
            isPublic: false,
            creatorId: se.exercise.creatorId,
            techniques: [],
            playerMin: null,
            playerMax: null,
            skillLevel: null,
            category: null
          }
        }
      }
      
      return se
    })

    return NextResponse.json({ exercises: filteredExercises })
  } catch (error) {
    console.error("Error fetching session exercises:", error)
    return NextResponse.json(
      { error: "Failed to fetch session exercises" },
      { status: 500 }
    )
  }
}
