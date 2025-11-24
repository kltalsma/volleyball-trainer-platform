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

    // Get all constraints on team_members table
    const constraints = await prisma.$queryRaw`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        tc.table_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_name = 'team_members'
      ORDER BY tc.constraint_name, kcu.ordinal_position
    `

    // Also check indexes
    const indexes = await prisma.$queryRaw`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'team_members'
    `

    return NextResponse.json({ 
      success: true,
      constraints,
      indexes,
      message: 'Current database constraints and indexes for team_members table'
    })
  } catch (error: any) {
    console.error('Error checking constraints:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to check constraints'
    }, { status: 500 })
  }
}
