import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const counts = await Promise.all([
      prisma.workout.count(),
      prisma.team.count(),
      prisma.exercise.count(),
      prisma.user.count(),
    ])
    
    return NextResponse.json({
      workouts: counts[0],
      teams: counts[1],
      exercises: counts[2],
      users: counts[3],
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
