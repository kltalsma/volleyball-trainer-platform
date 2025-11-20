import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/team-members - Add member to team
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { teamId, email, name, role, number, position } = body

    if (!teamId || !email || !name) {
      return NextResponse.json(
        { error: "teamId, email, and name are required" },
        { status: 400 }
      )
    }

    // Verify the team exists and user has permission
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        creatorId: true,
        members: {
          select: {
            id: true,
            userId: true,
            role: true
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

    // Check if user is ADMIN, team creator, OR a coach/assistant coach of this team
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    const isAdmin = currentUser?.role === 'ADMIN'
    const isCreator = team.creatorId === session.user.id
    const currentUserMember = team.members.find(m => m.userId === session.user.id)
    const isCoach = currentUserMember && (currentUserMember.role === "COACH" || currentUserMember.role === "ASSISTANT_COACH")

    if (!isAdmin && !isCreator && !isCoach) {
      return NextResponse.json(
        { error: "Only admins, the team creator, or coaches can add members to the team" },
        { status: 403 }
      )
    }

    // Find or create user by email
    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Create a placeholder user (they can claim it later by registering)
      // Generate a random password (they'll need to reset it)
      const bcrypt = require('bcryptjs')
      const randomPassword = Math.random().toString(36).slice(-8)
      const hashedPassword = await bcrypt.hash(randomPassword, 10)
      
      user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: role === "COACH" || role === "ASSISTANT_COACH" ? "TRAINER" : "PLAYER"
        }
      })
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: user.id
        }
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this team" },
        { status: 400 }
      )
    }

    // Add member to team
    const teamMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId: user.id,
        role: role || "PLAYER",
        number: number ? parseInt(number) : undefined,
        position
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(teamMember, { status: 201 })
  } catch (error) {
    console.error("Error adding team member:", error)
    return NextResponse.json(
      { error: "Failed to add team member" },
      { status: 500 }
    )
  }
}

// GET /api/team-members - Get members of a team
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("teamId")

    if (!teamId) {
      return NextResponse.json(
        { error: "teamId is required" },
        { status: 400 }
      )
    }

    // Check if user is ADMIN
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    const isAdmin = currentUser?.role === 'ADMIN'

    // Verify the team exists and user has permission to view
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: session.user.id }
        }
      }
    })

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      )
    }

    // Check if user is ADMIN or a member of this team
    if (!isAdmin && team.members.length === 0) {
      return NextResponse.json(
        { error: "You don't have permission to view this team" },
        { status: 403 }
      )
    }

    // Get all team members
    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: [
        { role: "asc" },
        { number: "asc" },
        { user: { name: "asc" } }
      ]
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error("Error fetching team members:", error)
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    )
  }
}
