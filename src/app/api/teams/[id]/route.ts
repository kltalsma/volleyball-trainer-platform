import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/teams/[id] - Get single team with its trainings
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
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        sport: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            joinedAt: "asc"
          }
        },
        workouts: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            _count: {
              select: {
                exercises: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        _count: {
          select: {
            members: true,
            workouts: true,
            trainingSessions: true
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      )
    }

    // Check if user is a member
    const isMember = team.members.some(m => m.userId === session.user.id)
    if (!isMember) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    return NextResponse.json(team)
  } catch (error) {
    console.error("Error fetching team:", error)
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    )
  }
}

// PATCH /api/teams/[id] - Update team
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
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: true
      }
    })

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      )
    }

    // Check if user is a coach
    const member = team.members.find(m => m.userId === session.user.id)
    if (!member || member.role === "PLAYER") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description } = body

    const updated = await prisma.team.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description })
      },
      include: {
        sport: true,
        _count: {
          select: {
            members: true,
            workouts: true
          }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating team:", error)
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    )
  }
}

// DELETE /api/teams/[id] - Delete team
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
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: true
      }
    })

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      )
    }

    // Check if user is a coach
    const member = team.members.find(m => m.userId === session.user.id)
    if (!member || member.role === "PLAYER") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    await prisma.team.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Team deleted successfully" })
  } catch (error) {
    console.error("Error deleting team:", error)
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    )
  }
}
