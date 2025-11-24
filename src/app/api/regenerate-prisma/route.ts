import { NextResponse } from 'next/server'
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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

    console.log('🔄 Regenerating Prisma client...')
    
    try {
      const result = await execAsync('npx prisma generate')
      console.log('Prisma generate output:', result.stdout)
      
      return NextResponse.json({ 
        success: true,
        message: 'Prisma client regenerated successfully. Please restart the application for changes to take effect.',
        output: result.stdout
      })
    } catch (error: any) {
      console.error('Prisma generate error:', error)
      return NextResponse.json({ 
        success: false,
        error: error.message,
        stderr: error.stderr
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error regenerating Prisma client:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to regenerate Prisma client'
    }, { status: 500 })
  }
}
