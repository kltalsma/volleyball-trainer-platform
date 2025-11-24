import { NextResponse } from 'next/server'
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is ADMIN
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    console.log('🔄 Starting comprehensive database constraint fix...')
    
    const steps = []
    
    // Step 1: Check current state
    console.log('Step 1: Checking current constraints and indexes...')
    const beforeConstraints = await prisma.$queryRaw`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'team_members'
      AND constraint_type = 'UNIQUE'
    `
    const beforeIndexes = await prisma.$queryRaw`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'team_members'
      AND indexname LIKE '%teamId%userId%'
    `
    steps.push({
      step: 1,
      action: 'Check current state',
      constraints: beforeConstraints,
      indexes: beforeIndexes
    })
    console.log('Before constraints:', beforeConstraints)
    console.log('Before indexes:', beforeIndexes)

    // Step 2: Drop old constraint (if exists)
    console.log('Step 2: Dropping old constraint...')
    try {
      await prisma.$executeRaw`
        ALTER TABLE "team_members" 
        DROP CONSTRAINT IF EXISTS "TeamMember_teamId_userId_key"
      `
      steps.push({
        step: 2,
        action: 'Drop old constraint "TeamMember_teamId_userId_key"',
        status: 'success'
      })
      console.log('✅ Dropped old constraint')
    } catch (e: any) {
      steps.push({
        step: 2,
        action: 'Drop old constraint "TeamMember_teamId_userId_key"',
        status: 'not_found',
        error: e.message
      })
      console.log('⚠️  Old constraint not found (may already be dropped)')
    }

    // Step 3: Drop old indexes (if they exist)
    console.log('Step 3: Dropping old indexes...')
    const oldIndexNames = [
      'team_members_teamId_userId_key',
      'TeamMember_teamId_userId_key'
    ]
    
    for (const indexName of oldIndexNames) {
      try {
        await prisma.$executeRaw`DROP INDEX IF EXISTS "${indexName}"`
        steps.push({
          step: 3,
          action: `Drop index "${indexName}"`,
          status: 'success'
        })
        console.log(`✅ Dropped index: ${indexName}`)
      } catch (e: any) {
        steps.push({
          step: 3,
          action: `Drop index "${indexName}"`,
          status: 'not_found',
          error: e.message
        })
        console.log(`⚠️  Index ${indexName} not found`)
      }
    }

    // Step 4: Drop new constraint if it exists (we'll recreate it properly)
    console.log('Step 4: Cleaning up existing new constraint...')
    try {
      await prisma.$executeRaw`
        ALTER TABLE "team_members" 
        DROP CONSTRAINT IF EXISTS "TeamMember_teamId_userId_role_key"
      `
      steps.push({
        step: 4,
        action: 'Drop existing new constraint (to recreate)',
        status: 'success'
      })
      console.log('✅ Cleaned up existing constraint')
    } catch (e: any) {
      steps.push({
        step: 4,
        action: 'Drop existing new constraint',
        status: 'not_found'
      })
      console.log('⚠️  New constraint not found')
    }

    // Step 5: Drop new index if it exists
    console.log('Step 5: Cleaning up existing new index...')
    try {
      await prisma.$executeRaw`DROP INDEX IF EXISTS "team_members_teamId_userId_role_key"`
      steps.push({
        step: 5,
        action: 'Drop existing new index',
        status: 'success'
      })
      console.log('✅ Cleaned up existing index')
    } catch (e: any) {
      steps.push({
        step: 5,
        action: 'Drop existing new index',
        status: 'not_found'
      })
    }

    // Step 6: Create the new constraint
    console.log('Step 6: Creating new constraint...')
    try {
      await prisma.$executeRaw`
        ALTER TABLE "team_members" 
        ADD CONSTRAINT "TeamMember_teamId_userId_role_key" 
        UNIQUE ("teamId", "userId", "role")
      `
      steps.push({
        step: 6,
        action: 'Create new constraint (teamId, userId, role)',
        status: 'success'
      })
      console.log('✅ Created new constraint')
    } catch (e: any) {
      steps.push({
        step: 6,
        action: 'Create new constraint',
        status: 'failed',
        error: e.message
      })
      console.error('❌ Failed to create constraint:', e.message)
      throw e
    }

    // Step 7: Verify the fix
    console.log('Step 7: Verifying...')
    const afterConstraints = await prisma.$queryRaw`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_name = 'team_members'
      AND tc.constraint_type = 'UNIQUE'
      GROUP BY tc.constraint_name, tc.constraint_type
    `
    const afterIndexes = await prisma.$queryRaw`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'team_members'
      AND indexname LIKE '%teamId%userId%'
    `
    steps.push({
      step: 7,
      action: 'Verify fix',
      constraints: afterConstraints,
      indexes: afterIndexes
    })
    console.log('After constraints:', afterConstraints)
    console.log('After indexes:', afterIndexes)

    // Step 8: Force Prisma client regeneration
    console.log('Step 8: Regenerating Prisma client...')
    // Note: This won't actually regenerate in runtime, but we document it
    steps.push({
      step: 8,
      action: 'Prisma client regeneration',
      status: 'requires_restart',
      note: 'Application restart required for Prisma client to pick up constraint changes'
    })

    return NextResponse.json({ 
      success: true,
      message: '✅ Database constraint fixed! Application restart recommended.',
      steps,
      summary: {
        before: {
          constraints: beforeConstraints,
          indexes: beforeIndexes
        },
        after: {
          constraints: afterConstraints,
          indexes: afterIndexes
        }
      }
    })
  } catch (error: any) {
    console.error('Error fixing constraint:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to fix constraint',
      stack: error.stack
    }, { status: 500 })
  }
}
