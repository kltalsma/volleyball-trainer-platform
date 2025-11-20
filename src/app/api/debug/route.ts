import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check if tables exist and count records
    const userCount = await prisma.user.count()
    const teamCount = await prisma.team.count()
    const exerciseCount = await prisma.exercise.count()
    const sessionCount = await prisma.trainingSession.count()
    
    return NextResponse.json({ 
      success: true,
      database: {
        users: userCount,
        teams: teamCount,
        exercises: exerciseCount,
        trainingSessions: sessionCount
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      database: 'Connection failed'
    }, { status: 500 })
  }
}