import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/attendance/[id] - Update a single attendance record
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    const { id } = await params

    const attendance = await prisma.trainingAttendance.findUnique({
      where: { id },
      include: {
        session: true,
        member: true
      }
    })

    if (!attendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      )
    }

    // Check if user is ADMIN, a coach of the team, OR the member themselves
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })
    const isAdmin = currentUser?.role === 'ADMIN'
    
    if (!isAdmin) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: attendance.session.teamId,
          userId: user.id
        }
      })

      if (!teamMember) {
        return NextResponse.json(
          { error: 'You do not have access to this attendance record' },
          { status: 403 }
        )
      }

      const isCoach = ['COACH', 'ASSISTANT_COACH'].includes(teamMember.role)
      const isSelf = attendance.memberId === teamMember.id

      // Only coaches can mark others, players can only mark themselves
      if (!isCoach && !isSelf) {
        return NextResponse.json(
          { error: 'You can only update your own attendance' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { status, notes } = body

    const updated = await prisma.trainingAttendance.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes })
      },
      include: {
        member: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating attendance:', error)
    return NextResponse.json(
      { error: 'Failed to update attendance' },
      { status: 500 }
    )
  }
}
