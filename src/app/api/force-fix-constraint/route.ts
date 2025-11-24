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

    console.log('🔄 Starting FORCE database constraint fix with unsafe raw SQL...')
    
    const steps = []
    const logs: string[] = []
    
    // Step 1: Check current state
    console.log('Step 1: Checking current constraints and indexes...')
    logs.push('Step 1: Checking current constraints and indexes...')
    
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
    logs.push(`Before constraints: ${JSON.stringify(beforeConstraints)}`)
    logs.push(`Before indexes: ${JSON.stringify(beforeIndexes)}`)

    // Step 2: Drop ALL unique constraints on team_members
    console.log('Step 2: Dropping ALL unique constraints...')
    logs.push('Step 2: Dropping ALL unique constraints...')
    
    const allConstraints = await prisma.$queryRaw<Array<{constraint_name: string}>>`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'team_members'
      AND constraint_type = 'UNIQUE'
    `
    
    for (const constraint of allConstraints) {
      try {
        // Use unsafe SQL execution
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "team_members" DROP CONSTRAINT "${constraint.constraint_name}"`
        )
        steps.push({
          step: 2,
          action: `Drop constraint "${constraint.constraint_name}"`,
          status: 'success'
        })
        logs.push(`✅ Dropped constraint: ${constraint.constraint_name}`)
      } catch (e: any) {
        steps.push({
          step: 2,
          action: `Drop constraint "${constraint.constraint_name}"`,
          status: 'failed',
          error: e.message
        })
        logs.push(`❌ Failed to drop constraint ${constraint.constraint_name}: ${e.message}`)
      }
    }

    // Step 3: Drop ALL related indexes
    console.log('Step 3: Dropping ALL related indexes...')
    logs.push('Step 3: Dropping ALL related indexes...')
    
    const allIndexes = await prisma.$queryRaw<Array<{indexname: string}>>`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'team_members'
      AND (indexname LIKE '%teamId%' OR indexname LIKE '%userId%')
    `
    
    for (const index of allIndexes) {
      // Skip primary key and foreign key indexes
      if (index.indexname.includes('pkey') || index.indexname.includes('fkey')) {
        logs.push(`⏭️  Skipping system index: ${index.indexname}`)
        continue
      }
      
      try {
        await prisma.$executeRawUnsafe(
          `DROP INDEX IF EXISTS "${index.indexname}"`
        )
        steps.push({
          step: 3,
          action: `Drop index "${index.indexname}"`,
          status: 'success'
        })
        logs.push(`✅ Dropped index: ${index.indexname}`)
      } catch (e: any) {
        steps.push({
          step: 3,
          action: `Drop index "${index.indexname}"`,
          status: 'failed',
          error: e.message
        })
        logs.push(`❌ Failed to drop index ${index.indexname}: ${e.message}`)
      }
    }

    // Step 4: Create the new constraint using unsafe raw SQL
    console.log('Step 4: Creating new constraint...')
    logs.push('Step 4: Creating new constraint...')
    
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "team_members" ADD CONSTRAINT "TeamMember_teamId_userId_role_key" UNIQUE ("teamId", "userId", "role")`
      )
      steps.push({
        step: 4,
        action: 'Create new constraint (teamId, userId, role)',
        status: 'success'
      })
      logs.push('✅ Created new constraint')
    } catch (e: any) {
      steps.push({
        step: 4,
        action: 'Create new constraint',
        status: 'failed',
        error: e.message
      })
      logs.push(`❌ Failed to create constraint: ${e.message}`)
      
      // Don't throw, continue to verify
    }

    // Step 5: Verify the fix
    console.log('Step 5: Verifying...')
    logs.push('Step 5: Verifying...')
    
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
      step: 5,
      action: 'Verify fix',
      constraints: afterConstraints,
      indexes: afterIndexes
    })
    logs.push(`After constraints: ${JSON.stringify(afterConstraints)}`)
    logs.push(`After indexes: ${JSON.stringify(afterIndexes)}`)

    console.log('All logs:', logs.join('\n'))

    return NextResponse.json({ 
      success: true,
      message: '✅ FORCE fix completed! Check logs and verify. Application restart REQUIRED.',
      steps,
      logs,
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
