import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sports = await prisma.sport.findMany({
      where: { active: true },
      orderBy: { name: "asc" }
    })

    return NextResponse.json(sports)
  } catch (error) {
    console.error("Error fetching sports:", error)
    return NextResponse.json(
      { error: "Failed to fetch sports" },
      { status: 500 }
    )
  }
}
