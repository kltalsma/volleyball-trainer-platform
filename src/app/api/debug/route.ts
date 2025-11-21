import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get some sample team member data to see what roles exist
    const members = await prisma.teamMember.findMany({
      take: 10,
      select: {
        id: true,
        role: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Check user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, role: true }
    })

    return NextResponse.json({
      authenticated: true,
      user,
      sampleMembers: members,
      availableRoles: [...new Set(members.map(m => m.role))],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}