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
    
    console.log('=== TEAM MEMBER UPDATE DEBUG ===')
    console.log('Member ID:', id)
    console.log('Update data:', { role, number, position })
    console.log('Current user ID:', session.user.id)

    // Get the team member and verify permissions
    const teamMember = await prisma.teamMember.findUnique({
      where: { id },
      include: {
        team: {
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
        }
      }
    })

    if (!teamMember) {
      console.log('❌ Team member not found with ID:', id)
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      )
    }
    
    console.log('✅ Found team member:', {
      id: teamMember.id,
      currentRole: teamMember.role,
      userId: teamMember.userId,
      teamId: teamMember.team.id
    })

    // Check if user is ADMIN, team creator, OR a coach/assistant coach of this team
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    const isAdmin = currentUser?.role === 'ADMIN'
    const isCreator = teamMember.team.creatorId === session.user.id
    const currentUserMember = teamMember.team.members.find(m => m.userId === session.user.id)
    const isCoach = currentUserMember && (currentUserMember.role === "COACH" || currentUserMember.role === "TRAINER" || currentUserMember.role === "ASSISTANT_COACH")

    console.log('🔐 Permission check:', {
      isAdmin,
      isCreator,
      currentUserMember: currentUserMember ? { role: currentUserMember.role } : null,
      isCoach,
      hasPermission: isAdmin || isCreator || isCoach
    })

    if (!isAdmin && !isCreator && !isCoach) {
      console.log('❌ Permission denied')
      return NextResponse.json(
        { error: "Only admins, the team creator, or coaches can update team members" },
        { status: 403 }
      )
    }

    // If changing someone's role away from leadership roles, ensure there's at least one leader remaining
    if (role && (role !== "COACH" && role !== "TRAINER" && role !== "ASSISTANT_COACH")) {
      const currentRole = teamMember.role
      if (currentRole === "COACH" || currentRole === "TRAINER" || currentRole === "ASSISTANT_COACH") {
        // Count how many leaders will remain after this change
        const leaderCount = teamMember.team.members.filter(m => 
          m.role === "COACH" || m.role === "TRAINER" || m.role === "ASSISTANT_COACH"
        ).length
        
        if (leaderCount <= 1) {
          return NextResponse.json(
            { error: "Cannot remove the last coach/trainer from the team. Please assign another leader first." },
            { status: 400 }
          )
        }
      }
    }

    // Update member
    console.log('Updating member with data:', { role, number, position })
    
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
    console.error("❌ Error updating team member:", error)
    
    // More specific error handling
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack?.substring(0, 500)
      })
      
      if (error.message.includes('Invalid enum value') || error.message.includes('invalid input value for enum')) {
        return NextResponse.json(
          { error: "Invalid role selected. The TRAINER role may not be fully activated yet." },
          { status: 400 }
        )
      }
      
      // Check for permission-related errors
      if (error.message.includes('Unique constraint') || error.message.includes('foreign key')) {
        return NextResponse.json(
          { error: "Database constraint violation. Please try again." },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: `Failed to update team member: ${error instanceof Error ? error.message : 'Unknown error'}` },
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
          select: {
            id: true,
            members: {
              select: {
                id: true,
                userId: true,
                role: true
              }
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

    // Check if user is ADMIN or a coach/assistant coach of this team
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    const isAdmin = currentUser?.role === 'ADMIN'
    const isCoach = teamMember.team.members.some(m => 
      m.userId === session.user.id && (m.role === "COACH" || m.role === "ASSISTANT_COACH")
    )

    if (!isAdmin && !isCoach) {
      return NextResponse.json(
        { error: "Only admins or coaches can remove team members" },
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
