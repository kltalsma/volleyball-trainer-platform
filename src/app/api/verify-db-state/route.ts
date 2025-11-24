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

    // Get constraints
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
      AND tc.constraint_type = 'UNIQUE'
      GROUP BY tc.constraint_name, tc.constraint_type
      ORDER BY tc.constraint_name
    `

    // Get indexes
    const indexes = await prisma.$queryRaw`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'team_members'
      AND indexname LIKE '%teamId%userId%'
      ORDER BY indexname
    `

    // Get table structure
    const tableStructure = await prisma.$queryRaw`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'team_members'
      ORDER BY ordinal_position
    `

    return NextResponse.json({ 
      constraints,
      indexes,
      tableStructure,
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL?.split('@')[1] || 'hidden'
    })
  } catch (error: any) {
    console.error('Error checking database state:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to check database state'
    }, { status: 500 })
  }
}
