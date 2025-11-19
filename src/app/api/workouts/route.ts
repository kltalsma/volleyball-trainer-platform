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
    const publicOnly = searchParams.get("publicOnly") === "true"
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // Default: show only user's own workouts and team workouts
    const where: any = {
      OR: [
        { creatorId: session.user.id },
        {
          team: {
            members: {
              some: {
                userId: session.user.id
              }
            }
          }
        }
      ]
    }

    if (myWorkouts) {
      where.creatorId = session.user.id
      delete where.OR
    }

    // Show only public workouts when explicitly requested
    if (publicOnly) {
      where.isPublic = true
      delete where.OR
    }

    if (teamId) {
      where.teamId = teamId
    }

    if (search) {
      // Store existing OR conditions if any
      const existingOr = where.OR
      where.AND = where.AND || []
      
      // Add search condition as AND with existing filters
      where.AND.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } }
        ]
      })
      
      // If we had OR conditions, add them to AND as well
      if (existingOr) {
        where.AND.push({ OR: existingOr })
        delete where.OR
      }
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

    // Build data object, only include fields that have values
    const data: any = {
      title,
      creatorId: session.user.id,
      isPublic: isPublic || false
    }

    if (description) data.description = description
    if (teamId) data.teamId = teamId
    if (startTime) data.startTime = new Date(startTime)
    if (endTime) data.endTime = new Date(endTime)
    if (totalDuration) data.totalDuration = totalDuration

    const workout = await prisma.workout.create({
      data,
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
    const errorMessage = error instanceof Error ? error.message : "Failed to create workout"
    return NextResponse.json(
      { error: "Failed to create workout", details: errorMessage },
      { status: 500 }
    )
  }
}
