import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAvailableThemes } from '@/lib/themes'

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { theme } = body

    if (!theme || typeof theme !== 'string') {
      return NextResponse.json(
        { error: 'Theme is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate theme exists
    const availableThemes = getAvailableThemes()
    const themeExists = availableThemes.some(t => t.id === theme)
    
    if (!themeExists) {
      return NextResponse.json(
        { error: 'Invalid theme ID' },
        { status: 400 }
      )
    }

    // Update user theme in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { theme },
      select: {
        id: true,
        theme: true,
      },
    })

    console.log(`✅ Theme updated for user ${session.user.id}: ${theme}`)

    return NextResponse.json({
      success: true,
      theme: updatedUser.theme,
    })
  } catch (error) {
    console.error('❌ Error updating theme:', error)
    console.error('❌ Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { 
        error: 'Failed to update theme',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
