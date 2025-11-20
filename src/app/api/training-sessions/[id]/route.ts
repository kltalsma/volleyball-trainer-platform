import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/training-sessions/[id] - Get a specific training session
export async function GET(
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

    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          }
        },
        workout: {
          select: {
            id: true,
            title: true,
            description: true,
            totalDuration: true,
            exercises: {
              include: {
                exercise: {
                  select: {
                    id: true,
                    title: true,
                    description: true,
                    duration: true,
                    difficulty: true,
                  }
                }
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        },
        attendance: {
          include: {
            member: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  }
                }
              }
            }
          },
          orderBy: {
            member: {
              user: {
                name: 'asc'
              }
            }
          }
        }
      }
    })

    if (!trainingSession) {
      return NextResponse.json(
        { error: 'Training session not found' },
        { status: 404 }
      )
    }

    // Check if user is ADMIN or a member of the team
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })
    const isAdmin = currentUser?.role === 'ADMIN'
    
    if (!isAdmin) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: trainingSession.teamId,
          userId: user.id
        }
      })

      if (!teamMember) {
        return NextResponse.json(
          { error: 'You do not have access to this training session' },
          { status: 403 }
        )
      }
    }

    // Add attendance summary
    const totalMembers = trainingSession.attendance.length
    const present = trainingSession.attendance.filter(a => a.status === 'PRESENT').length
    const absent = trainingSession.attendance.filter(a => a.status === 'ABSENT').length
    const late = trainingSession.attendance.filter(a => a.status === 'LATE').length
    const excused = trainingSession.attendance.filter(a => a.status === 'EXCUSED').length
    const pending = trainingSession.attendance.filter(a => a.status === 'PENDING').length

    return NextResponse.json({
      ...trainingSession,
      attendanceSummary: {
        total: totalMembers,
        present,
        absent,
        late,
        excused,
        pending
      }
    })
  } catch (error) {
    console.error('Error fetching training session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch training session' },
      { status: 500 }
    )
  }
}

// PATCH /api/training-sessions/[id] - Update a training session
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

    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id }
    })

    if (!trainingSession) {
      return NextResponse.json(
        { error: 'Training session not found' },
        { status: 404 }
      )
    }

    // Check if user is ADMIN or a coach of the team
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })
    const isAdmin = currentUser?.role === 'ADMIN'
    
    if (!isAdmin) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: trainingSession.teamId,
          userId: user.id,
          role: { in: ['COACH', 'ASSISTANT_COACH'] }
        }
      })

      if (!teamMember) {
        return NextResponse.json(
          { error: 'You must be a coach to update training sessions' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { title, description, scheduledAt, duration, location, status } = body

    const updated = await prisma.trainingSession.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(duration !== undefined && { duration }),
        ...(location !== undefined && { location }),
        ...(status && { status })
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          }
        },
        workout: {
          select: {
            id: true,
            title: true,
            totalDuration: true,
          }
        },
        attendance: {
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
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating training session:', error)
    return NextResponse.json(
      { error: 'Failed to update training session' },
      { status: 500 }
    )
  }
}

// DELETE /api/training-sessions/[id] - Delete a training session
export async function DELETE(
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

    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id }
    })

    if (!trainingSession) {
      return NextResponse.json(
        { error: 'Training session not found' },
        { status: 404 }
      )
    }

    // Check if user is ADMIN or a coach of the team
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })
    const isAdmin = currentUser?.role === 'ADMIN'
    
    if (!isAdmin) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: trainingSession.teamId,
          userId: user.id,
          role: { in: ['COACH', 'ASSISTANT_COACH'] }
        }
      })

      if (!teamMember) {
        return NextResponse.json(
          { error: 'You must be a coach to delete training sessions' },
          { status: 403 }
        )
      }
    }

    // Delete the training session (attendance will be cascade deleted)
    await prisma.trainingSession.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting training session:', error)
    return NextResponse.json(
      { error: 'Failed to delete training session' },
      { status: 500 }
    )
  }
}
