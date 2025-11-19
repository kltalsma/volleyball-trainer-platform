import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/exercises - List exercises with filters
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sportId = searchParams.get("sportId")
    const categoryId = searchParams.get("categoryId")
    const difficulty = searchParams.get("difficulty")
    const search = searchParams.get("search")
    const myExercises = searchParams.get("myExercises") === "true"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

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

    if (sportId) {
      where.sportId = sportId
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (difficulty) {
      where.difficulty = difficulty
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search } }
      ]
    }

    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
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
        },
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take: limit
      }),
      prisma.exercise.count({ where })
    ])

    return NextResponse.json({
      exercises,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching exercises:", error)
    return NextResponse.json(
      { error: "Failed to fetch exercises" },
      { status: 500 }
    )
  }
}

// POST /api/exercises - Create new exercise
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      duration,
      difficulty,
      sportId,
      categoryId,
      isPublic,
      diagram,
      videoUrl,
      tags
    } = body

    if (!title || !sportId) {
      return NextResponse.json(
        { error: "Title and sport are required" },
        { status: 400 }
      )
    }

    const exercise = await prisma.exercise.create({
      data: {
        title,
        description,
        duration,
        difficulty: difficulty || "MEDIUM",
        sportId,
        categoryId,
        creatorId: session.user.id,
        isPublic: isPublic || false,
        diagram,
        videoUrl,
        tags: tags || []
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

    return NextResponse.json(exercise, { status: 201 })
  } catch (error) {
    console.error("Error creating exercise:", error)
    return NextResponse.json(
      { error: "Failed to create exercise" },
      { status: 500 }
    )
  }
}
