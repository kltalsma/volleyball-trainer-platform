import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/exercises/[id] - Get single exercise
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
    const exercise = await prisma.exercise.findUnique({
      where: { id },
      include: {
        sport: true,
        category: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            favorites: true,
            workoutExercises: true
          }
        }
      }
    })

    if (!exercise) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 }
      )
    }

    // Check access rights
    if (!exercise.isPublic && exercise.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    // Increment view count
    await prisma.exercise.update({
      where: { id },
      data: { views: { increment: 1 } }
    })

    return NextResponse.json(exercise)
  } catch (error) {
    console.error("Error fetching exercise:", error)
    return NextResponse.json(
      { error: "Failed to fetch exercise" },
      { status: 500 }
    )
  }
}

// PATCH /api/exercises/[id] - Update exercise
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
    const exercise = await prisma.exercise.findUnique({
      where: { id }
    })

    if (!exercise) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 }
      )
    }

    if (exercise.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      duration,
      difficulty,
      categoryId,
      isPublic,
      diagram,
      videoUrl,
      tags
    } = body

    const updated = await prisma.exercise.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(duration !== undefined && { duration }),
        ...(difficulty && { difficulty }),
        ...(categoryId !== undefined && { categoryId }),
        ...(isPublic !== undefined && { isPublic }),
        ...(diagram !== undefined && { diagram }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(tags && { tags })
      },
      include: {
        sport: true,
        category: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating exercise:", error)
    return NextResponse.json(
      { error: "Failed to update exercise" },
      { status: 500 }
    )
  }
}

// DELETE /api/exercises/[id] - Delete exercise
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
    const exercise = await prisma.exercise.findUnique({
      where: { id }
    })

    if (!exercise) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 }
      )
    }

    if (exercise.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    await prisma.exercise.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Exercise deleted successfully" })
  } catch (error) {
    console.error("Error deleting exercise:", error)
    return NextResponse.json(
      { error: "Failed to delete exercise" },
      { status: 500 }
    )
  }
}
