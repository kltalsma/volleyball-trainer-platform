import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { confirmReset } = body

    if (confirmReset !== 'YES_RESET_EVERYTHING') {
      return NextResponse.json({
        success: false,
        error: 'Must send { "confirmReset": "YES_RESET_EVERYTHING" } to proceed'
      }, { status: 400 })
    }

    console.log('🗑️  Deleting ALL data from database...')

    // Delete ALL data in correct order to respect foreign key constraints
    await prisma.trainingAttendance.deleteMany()
    await prisma.sessionExercise.deleteMany()
    await prisma.trainingSession.deleteMany()
    await prisma.workoutExercise.deleteMany()
    await prisma.workout.deleteMany()
    await prisma.favoriteExercise.deleteMany()
    await prisma.exercise.deleteMany()
    await prisma.teamMember.deleteMany()
    await prisma.team.deleteMany()
    await prisma.user.deleteMany()
    await prisma.exerciseCategory.deleteMany()
    await prisma.sport.deleteMany()

    console.log('✅ Deleted all data')
    console.log('🌱 Running fresh seed...')

    // Run database seeding
    await execAsync('npm run db:seed')

    const counts = {
      workouts: await prisma.workout.count(),
      teams: await prisma.team.count(),
      exercises: await prisma.exercise.count(),
      users: await prisma.user.count(),
    }

    console.log('✅ Seed completed')
    console.log(`   Workouts: ${counts.workouts}`)
    console.log(`   Teams: ${counts.teams}`)
    console.log(`   Exercises: ${counts.exercises}`)
    console.log(`   Users: ${counts.users}`)

    return NextResponse.json({
      success: true,
      message: 'Database completely reset and reseeded',
      counts
    })
  } catch (error) {
    console.error('Reset error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
