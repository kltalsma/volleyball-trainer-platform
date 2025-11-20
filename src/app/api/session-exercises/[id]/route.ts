import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH /api/session-exercises/[id] - Update a session exercise
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

    // Get the session exercise with training session info
    const sessionExercise = await prisma.sessionExercise.findUnique({
      where: { id },
      include: {
        session: {
          select: {
            id: true,
            teamId: true,
            team: {
              select: {
                members: {
                  where: {
                    userId: session.user.id,
                    role: { in: ['COACH', 'ASSISTANT_COACH'] }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!sessionExercise) {
      return NextResponse.json(
        { error: "Session exercise not found" },
        { status: 404 }
      )
    }

    // Check if user is a coach
    if (sessionExercise.session.team.members.length === 0) {
      return NextResponse.json(
        { error: "You must be a coach to modify this training session" },
        { status: 403 }
      )
    }

    // Update the session exercise
    const updated = await prisma.sessionExercise.update({
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
            duration: true,
            diagram: true,
            videoUrl: true
          }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating session exercise:", error)
    return NextResponse.json(
      { error: "Failed to update session exercise" },
      { status: 500 }
    )
  }
}

// DELETE /api/session-exercises/[id] - Remove exercise from training session
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

    // Get the session exercise with training session info
    const sessionExercise = await prisma.sessionExercise.findUnique({
      where: { id },
      include: {
        session: {
          select: {
            id: true,
            teamId: true,
            team: {
              select: {
                members: {
                  where: {
                    userId: session.user.id,
                    role: { in: ['COACH', 'ASSISTANT_COACH'] }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!sessionExercise) {
      return NextResponse.json(
        { error: "Session exercise not found" },
        { status: 404 }
      )
    }

    // Check if user is a coach
    if (sessionExercise.session.team.members.length === 0) {
      return NextResponse.json(
        { error: "You must be a coach to modify this training session" },
        { status: 403 }
      )
    }

    // Delete the session exercise
    await prisma.sessionExercise.delete({
      where: { id }
    })

    // Reorder remaining exercises
    const remainingExercises = await prisma.sessionExercise.findMany({
      where: { sessionId: sessionExercise.session.id },
      orderBy: { order: "asc" }
    })

    // Update orders to be sequential
    await Promise.all(
      remainingExercises.map((ex, index) =>
        prisma.sessionExercise.update({
          where: { id: ex.id },
          data: { order: index + 1 }
        })
      )
    )

    return NextResponse.json({ message: "Exercise removed successfully" })
  } catch (error) {
    console.error("Error deleting session exercise:", error)
    return NextResponse.json(
      { error: "Failed to remove exercise from training session" },
      { status: 500 }
    )
  }
}
