import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/training-sessions - List training sessions
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const status = searchParams.get('status')
    const from = searchParams.get('from') // ISO date string
    const to = searchParams.get('to') // ISO date string

    // Build where clause
    const where: any = {}
    
    if (teamId) {
      where.teamId = teamId
    } else {
      // Get all teams where user is a member
      const userTeams = await prisma.teamMember.findMany({
        where: { userId: user.id },
        select: { teamId: true }
      })
      where.teamId = {
        in: userTeams.map(tm => tm.teamId)
      }
    }

    if (status) {
      where.status = status
    }

    if (from || to) {
      where.scheduledAt = {}
      if (from) {
        where.scheduledAt.gte = new Date(from)
      }
      if (to) {
        where.scheduledAt.lte = new Date(to)
      }
    }

    const sessions = await prisma.trainingSession.findMany({
      where,
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
      },
      orderBy: {
        scheduledAt: 'desc'
      }
    })

    // Add attendance summary to each session
    const sessionsWithSummary = sessions.map(session => {
      const totalMembers = session.attendance.length
      const present = session.attendance.filter(a => a.status === 'PRESENT').length
      const absent = session.attendance.filter(a => a.status === 'ABSENT').length
      const late = session.attendance.filter(a => a.status === 'LATE').length
      const excused = session.attendance.filter(a => a.status === 'EXCUSED').length
      const pending = session.attendance.filter(a => a.status === 'PENDING').length

      return {
        ...session,
        attendanceSummary: {
          total: totalMembers,
          present,
          absent,
          late,
          excused,
          pending
        }
      }
    })

    return NextResponse.json(sessionsWithSummary)
  } catch (error) {
    console.error('Error fetching training sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch training sessions' },
      { status: 500 }
    )
  }
}

// POST /api/training-sessions - Create a new training session
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user

    const body = await request.json()
    const { teamId, workoutId, title, description, scheduledAt, duration, location } = body

    // Validate required fields
    if (!teamId || !title || !scheduledAt) {
      return NextResponse.json(
        { error: 'Missing required fields: teamId, title, scheduledAt' },
        { status: 400 }
      )
    }

    // Check if user is a member of the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
        role: { in: ['COACH', 'ASSISTANT_COACH'] }
      }
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: 'You must be a coach of this team to create training sessions' },
        { status: 403 }
      )
    }

    // Create the training session
    const trainingSession = await prisma.trainingSession.create({
      data: {
        teamId,
        workoutId: workoutId || null,
        title,
        description,
        scheduledAt: new Date(scheduledAt),
        duration,
        location,
        status: 'SCHEDULED'
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
        }
      }
    })

    // Automatically create attendance records for all team members
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId }
    })

    await prisma.trainingAttendance.createMany({
      data: teamMembers.map(member => ({
        sessionId: trainingSession.id,
        memberId: member.id,
        status: 'PENDING'
      }))
    })

    // Fetch the complete session with attendance
    const completeSession = await prisma.trainingSession.findUnique({
      where: { id: trainingSession.id },
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

    return NextResponse.json(completeSession, { status: 201 })
  } catch (error) {
    console.error('Error creating training session:', error)
    return NextResponse.json(
      { error: 'Failed to create training session' },
      { status: 500 }
    )
  }
}
