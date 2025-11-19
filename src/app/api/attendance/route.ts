import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/attendance - Bulk update attendance
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user

    const body = await request.json()
    const { attendanceUpdates } = body

    // attendanceUpdates should be an array of { id, status, notes? }
    if (!Array.isArray(attendanceUpdates) || attendanceUpdates.length === 0) {
      return NextResponse.json(
        { error: 'attendanceUpdates must be a non-empty array' },
        { status: 400 }
      )
    }

    // Get the first attendance record to check permissions
    const firstAttendance = await prisma.trainingAttendance.findUnique({
      where: { id: attendanceUpdates[0].id },
      include: {
        session: true
      }
    })

    if (!firstAttendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      )
    }

    // Check if user is a coach of the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: firstAttendance.session.teamId,
        userId: user.id,
        role: { in: ['COACH', 'ASSISTANT_COACH'] }
      }
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: 'You must be a coach to update attendance' },
        { status: 403 }
      )
    }

    // Update all attendance records
    const updatePromises = attendanceUpdates.map(update =>
      prisma.trainingAttendance.update({
        where: { id: update.id },
        data: {
          status: update.status,
          ...(update.notes !== undefined && { notes: update.notes })
        }
      })
    )

    const results = await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      updated: results.length
    })
  } catch (error) {
    console.error('Error updating attendance:', error)
    return NextResponse.json(
      { error: 'Failed to update attendance' },
      { status: 500 }
    )
  }
}
