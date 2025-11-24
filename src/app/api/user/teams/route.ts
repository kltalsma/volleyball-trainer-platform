import { NextResponse } from 'next/server'
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // Get user with all team memberships
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        teams: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                sport: {
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      memberships: user.teams.map(m => ({
        id: m.id,
        teamId: m.teamId,
        teamName: m.team.name,
        sport: m.team.sport.name,
        role: m.role,
        joinedAt: m.joinedAt
      }))
    })
  } catch (error: any) {
    console.error('Error fetching user teams:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to fetch user teams'
    }, { status: 500 })
  }
}
