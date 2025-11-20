import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/workouts/[id] - Get single workout
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const workout = await prisma.workout.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        team: {
          select: {
            id: true,
            name: true
          }
        },
        exercises: {
          include: {
            exercise: {
              include: {
                category: true
              }
            }
          },
          orderBy: {
            order: "asc"
          }
        },
        _count: {
          select: {
            exercises: true,
            trainingSessions: true
          }
        }
      }
    })

    if (!workout) {
      return NextResponse.json(
        { error: "Training not found" },
        { status: 404 }
      )
    }

    // Check access rights - ADMIN can view all workouts
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    const isAdmin = currentUser?.role === 'ADMIN'
    
    if (!isAdmin && !workout.isPublic && workout.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    return NextResponse.json(workout)
  } catch (error) {
    console.error("Error fetching workout:", error)
    return NextResponse.json(
      { error: "Failed to fetch training" },
      { status: 500 }
    )
  }
}

// PATCH /api/workouts/[id] - Update workout
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
    const workout = await prisma.workout.findUnique({
      where: { id }
    })

    if (!workout) {
      return NextResponse.json(
        { error: "Training not found" },
        { status: 404 }
      )
    }

    // Check if user is ADMIN or creator
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    const isAdmin = currentUser?.role === 'ADMIN'

    if (!isAdmin && workout.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      teamId,
      isPublic,
      startTime,
      endTime,
      totalDuration,
      diagram
    } = body

    const updated = await prisma.workout.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(teamId !== undefined && { teamId }),
        ...(isPublic !== undefined && { isPublic }),
        ...(startTime !== undefined && { startTime: startTime ? new Date(startTime) : null }),
        ...(endTime !== undefined && { endTime: endTime ? new Date(endTime) : null }),
        ...(totalDuration !== undefined && { totalDuration }),
        ...(diagram !== undefined && { diagram })
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        team: {
          select: {
            id: true,
            name: true
          }
        },
        exercises: {
          include: {
            exercise: {
              include: {
                category: true
              }
            }
          },
          orderBy: {
            order: "asc"
          }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating workout:", error)
    return NextResponse.json(
      { error: "Failed to update training" },
      { status: 500 }
    )
  }
}

// DELETE /api/workouts/[id] - Delete workout
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
    const workout = await prisma.workout.findUnique({
      where: { id }
    })

    if (!workout) {
      return NextResponse.json(
        { error: "Training not found" },
        { status: 404 }
      )
    }

    // Check if user is ADMIN or creator
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    const isAdmin = currentUser?.role === 'ADMIN'

    if (!isAdmin && workout.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    await prisma.workout.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Training deleted successfully" })
  } catch (error) {
    console.error("Error deleting workout:", error)
    return NextResponse.json(
      { error: "Failed to delete training" },
      { status: 500 }
    )
  }
}
