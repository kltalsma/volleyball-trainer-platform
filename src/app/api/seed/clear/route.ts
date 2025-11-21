import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { confirmClear } = body

    if (confirmClear !== 'YES_CLEAR_ALL_DATA') {
      return NextResponse.json({
        success: false,
        error: 'Must send { "confirmClear": "YES_CLEAR_ALL_DATA" } to proceed'
      }, { status: 400 })
    }

    console.log('🗑️  Clearing all teams, exercises, and related data...')

    // Delete in correct order to respect foreign key constraints
    await prisma.trainingAttendance.deleteMany()
    await prisma.sessionExercise.deleteMany()
    await prisma.trainingSession.deleteMany()
    await prisma.workoutExercise.deleteMany()
    await prisma.workout.deleteMany()
    await prisma.favoriteExercise.deleteMany()
    await prisma.exercise.deleteMany()
    await prisma.teamMember.deleteMany()
    await prisma.team.deleteMany()

    console.log('✅ Cleared all seed data')
    console.log('🌱 Running fresh seed...')

    // Run database seeding
    await execAsync('npm run db:seed')

    return NextResponse.json({
      success: true,
      message: 'Database cleared and reseeded successfully'
    })
  } catch (error) {
    console.error('Clear and reseed error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
