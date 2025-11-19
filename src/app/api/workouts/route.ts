import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/workouts - List workouts with filters
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("teamId")
    const myWorkouts = searchParams.get("myWorkouts") === "true"
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: any = {
      OR: [
        { isPublic: true },
        { creatorId: session.user.id }
      ]
    }

    if (myWorkouts) {
      where.creatorId = session.user.id
      delete where.OR
    }

    if (teamId) {
      where.teamId = teamId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    }

    const [workouts, total] = await Promise.all([
      prisma.workout.findMany({
        where,
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
          _count: {
            select: {
              exercises: true,
              trainingSessions: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take: limit
      }),
      prisma.workout.count({ where })
    ])

    return NextResponse.json({
      workouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching workouts:", error)
    return NextResponse.json(
      { error: "Failed to fetch workouts" },
      { status: 500 }
    )
  }
}

// POST /api/workouts - Create new workout
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
      teamId,
      isPublic,
      startTime,
      endTime,
      totalDuration
    } = body

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    const workout = await prisma.workout.create({
      data: {
        title,
        description,
        teamId,
        creatorId: session.user.id,
        isPublic: isPublic || false,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        totalDuration
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
        _count: {
          select: {
            exercises: true
          }
        }
      }
    })

    return NextResponse.json(workout, { status: 201 })
  } catch (error) {
    console.error("Error creating workout:", error)
    return NextResponse.json(
      { error: "Failed to create workout" },
      { status: 500 }
    )
  }
}
