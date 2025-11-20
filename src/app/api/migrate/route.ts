import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST() {
  try {
    console.log('🔄 Starting manual database migration...')
    
    // Generate Prisma client
    console.log('🔧 Generating Prisma client...')
    await execAsync('npx prisma generate')
    
    // Run migrations
    console.log('📊 Deploying migrations...')
    const migrateResult = await execAsync('npx prisma migrate deploy')
    console.log('Migration output:', migrateResult.stdout)
    
    // Run seed
    console.log('🌱 Running database seed...')
    const seedResult = await execAsync('npm run db:seed')
    console.log('Seed output:', seedResult.stdout)
    
    return NextResponse.json({ 
      success: true,
      message: 'Database migrated and seeded successfully',
      migration: migrateResult.stdout,
      seed: seedResult.stdout
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}