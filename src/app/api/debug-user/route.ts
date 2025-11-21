import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/debug-user - Debug current user session and permissions
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ 
        error: "No session",
        authenticated: false 
      })
    }

    // Get full user details from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({
        error: "User not found in database",
        sessionUser: session.user
      })
    }

    // Get team memberships
    const teamMemberships = await prisma.teamMember.findMany({
      where: { userId: user.id },
      include: {
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Get workouts created by user
    const createdWorkouts = await prisma.workout.count({
      where: { creatorId: user.id }
    })

    // Check what workouts user should see based on current logic
    const isAdmin = user.role === 'ADMIN'
    
    let visibleWorkouts = 0
    if (isAdmin) {
      visibleWorkouts = await prisma.workout.count()
    } else {
      visibleWorkouts = await prisma.workout.count({
        where: {
          OR: [
            { creatorId: user.id },
            {
              team: {
                members: {
                  some: {
                    userId: user.id
                  }
                }
              }
            }
          ]
        }
      })
    }

    return NextResponse.json({
      authenticated: true,
      session: {
        user: session.user,
        expires: session.expires
      },
      database: {
        user,
        isAdmin,
        teamMemberships: teamMemberships.length,
        teams: teamMemberships.map(m => ({
          id: m.team.id,
          name: m.team.name,
          role: m.role
        })),
        createdWorkouts,
        visibleWorkouts,
        totalWorkoutsInDb: await prisma.workout.count()
      },
      permissions: {
        canSeeAllWorkouts: isAdmin,
        canAccessAllTeams: isAdmin,
        requiresTeamMembership: !isAdmin
      }
    })
  } catch (error) {
    console.error("Error in debug-user:", error)
    return NextResponse.json(
      { error: "Failed to debug user", details: String(error) },
      { status: 500 }
    )
  }
}
