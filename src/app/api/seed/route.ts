import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST() {
  try {
    // Run database migrations
    console.log('Running migrations...')
    await execAsync('npx prisma migrate deploy')
    
    // Run database seeding
    console.log('Running seed...')
    await execAsync('npm run db:seed')
    
    return NextResponse.json({ 
      success: true,
      message: 'Database migrated and seeded successfully'
    })
  } catch (error) {
    console.error('Seeding error:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}