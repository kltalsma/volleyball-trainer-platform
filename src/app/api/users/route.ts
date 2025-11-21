import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get search query from URL params
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    // Fetch users with optional search filter
    const users = await prisma.user.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      } : undefined,
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      },
      orderBy: [
        { name: 'asc' },
        { email: 'asc' }
      ],
      take: 50 // Limit to 50 users for performance
    })

    return NextResponse.json(users)

  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
