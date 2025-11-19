import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH /api/team-members/[id] - Update team member
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { role, number, position } = body

    // Get the team member and verify permissions
    const teamMember = await prisma.teamMember.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            members: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      )
    }

    // Check if user is a coach/assistant coach of this team
    const isCoach = teamMember.team.members.some(m => 
      m.role === "COACH" || m.role === "ASSISTANT_COACH"
    )

    if (!isCoach) {
      return NextResponse.json(
        { error: "Only coaches can update team members" },
        { status: 403 }
      )
    }

    // Update member
    const updatedMember = await prisma.teamMember.update({
      where: { id },
      data: {
        ...(role && { role }),
        ...(number !== undefined && { number: number ? parseInt(number) : null }),
        ...(position !== undefined && { position: position || null })
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

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error("Error updating team member:", error)
    return NextResponse.json(
      { error: "Failed to update team member" },
      { status: 500 }
    )
  }
}

// DELETE /api/team-members/[id] - Remove team member
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the team member and verify permissions
    const teamMember = await prisma.teamMember.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            members: true
          }
        }
      }
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      )
    }

    // Check if user is a coach/assistant coach of this team
    const isCoach = teamMember.team.members.some(m => 
      m.userId === session.user.id && (m.role === "COACH" || m.role === "ASSISTANT_COACH")
    )

    if (!isCoach) {
      return NextResponse.json(
        { error: "Only coaches can remove team members" },
        { status: 403 }
      )
    }

    // Prevent removing the last member (would orphan the team)
    if (teamMember.team.members.length === 1) {
      return NextResponse.json(
        { error: "Cannot remove the last member. Delete the team instead if you want to remove it completely." },
        { status: 400 }
      )
    }

    // Delete member
    await prisma.teamMember.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Team member removed successfully" })
  } catch (error) {
    console.error("Error removing team member:", error)
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    )
  }
}
