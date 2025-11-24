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

    console.log('🔄 Fixing database constraint...')
    
    // Check current constraint
    const checkConstraint = await prisma.$queryRaw`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'TeamMember'
      AND constraint_type = 'UNIQUE'
    `
    console.log('Current constraints:', checkConstraint)

    // Drop the old constraint if it exists
    try {
      await prisma.$executeRaw`
        ALTER TABLE "TeamMember" 
        DROP CONSTRAINT IF EXISTS "TeamMember_teamId_userId_key"
      `
      console.log('✅ Dropped old constraint (teamId, userId)')
    } catch (e) {
      console.log('⚠️  Old constraint may not exist:', e)
    }

    // Add the new constraint
    try {
      await prisma.$executeRaw`
        ALTER TABLE "TeamMember" 
        ADD CONSTRAINT "TeamMember_teamId_userId_role_key" 
        UNIQUE ("teamId", "userId", "role")
      `
      console.log('✅ Added new constraint (teamId, userId, role)')
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log('✅ New constraint already exists')
      } else {
        throw e
      }
    }

    // Verify the fix
    const verifyConstraint = await prisma.$queryRaw`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'TeamMember'
      AND constraint_type = 'UNIQUE'
    `
    console.log('Updated constraints:', verifyConstraint)

    return NextResponse.json({ 
      success: true,
      message: 'Database constraint fixed successfully',
      before: checkConstraint,
      after: verifyConstraint
    })
  } catch (error: any) {
    console.error('Error fixing constraint:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to fix constraint'
    }, { status: 500 })
  }
}
