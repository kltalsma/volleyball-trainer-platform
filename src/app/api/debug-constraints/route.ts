import { NextResponse } from 'next/server'
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
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

    // Get all constraints on team_members table with their columns
    const constraints = await prisma.$queryRaw`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_name = 'team_members'
      GROUP BY tc.constraint_name, tc.constraint_type
      ORDER BY tc.constraint_name
    `

    // Get all indexes on team_members table
    const indexes = await prisma.$queryRaw`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'team_members'
      ORDER BY indexname
    `

    // Get migration history
    const migrations = await prisma.$queryRaw`
      SELECT 
        migration_name,
        finished_at,
        applied_steps_count
      FROM "_prisma_migrations"
      WHERE migration_name LIKE '%allow_multiple_roles%'
      ORDER BY finished_at DESC
    `

    // Get sample team member data to verify actual constraint behavior
    const sampleData = await prisma.$queryRaw`
      SELECT 
        "userId",
        "teamId",
        role,
        COUNT(*) as count
      FROM team_members
      GROUP BY "userId", "teamId", role
      HAVING COUNT(*) > 1
      LIMIT 5
    `

    return NextResponse.json({ 
      constraints,
      indexes,
      migrations,
      duplicateCheck: sampleData,
      note: "If duplicateCheck has results, there are duplicate (userId, teamId, role) combinations"
    })
  } catch (error: any) {
    console.error('Error checking constraints:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to check constraints'
    }, { status: 500 })
  }
}
