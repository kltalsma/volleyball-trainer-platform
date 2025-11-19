import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/teams - List teams
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const myTeams = searchParams.get("myTeams") === "true"

    const where: any = {}

    if (myTeams) {
      where.members = {
        some: {
          userId: session.user.id
        }
      }
    }

    const teams = await prisma.team.findMany({
      where,
      include: {
        sport: true,
        _count: {
          select: {
            members: true,
            workouts: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({ teams })
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    )
  }
}

// POST /api/teams - Create new team
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      sportId,
      volleybalNlApiId,
      volleybalNlClubId,
      volleybalNlCategory,
      volleybalNlTeamNumber
    } = body

    if (!name || !sportId) {
      return NextResponse.json(
        { error: "Name and sport are required" },
        { status: 400 }
      )
    }

    const team = await prisma.team.create({
      data: {
        name,
        description,
        sportId,
        volleybalNlApiId: volleybalNlApiId || null,
        volleybalNlClubId: volleybalNlClubId || null,
        volleybalNlCategory: volleybalNlCategory || null,
        volleybalNlTeamNumber: volleybalNlTeamNumber || null,
        members: {
          create: {
            userId: session.user.id,
            role: "COACH"
          }
        }
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

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error("Error creating team:", error)
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    )
  }
}
