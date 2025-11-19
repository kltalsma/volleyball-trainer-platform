import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTrainings() {
  try {
    console.log('\n=== All Workouts ===')
    const workouts = await prisma.workout.findMany({
      select: {
        id: true,
        title: true,
        startTime: true,
        isPublic: true,
        creatorId: true,
        teamId: true,
        createdAt: true,
        creator: {
          select: {
            email: true,
            name: true
          }
        },
        team: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    console.log(`Found ${workouts.length} workouts:\n`)
    workouts.forEach(w => {
      console.log(`ID: ${w.id}`)
      console.log(`Title: ${w.title}`)
      console.log(`StartTime: ${w.startTime}`)
      console.log(`IsPublic: ${w.isPublic}`)
      console.log(`Creator: ${w.creator.name || w.creator.email}`)
      console.log(`Team: ${w.team?.name || 'None'}`)
      console.log(`Created: ${w.createdAt}`)
      console.log('---')
    })
    
    // Now test the dashboard query
    console.log('\n=== Testing Dashboard Query (startTime null OR future) ===')
    const dashboardQuery = await prisma.workout.findMany({
      where: {
        AND: [
          {
            OR: [
              { isPublic: true },
              // We'll skip user-specific filters for this test
            ]
          },
          {
            OR: [
              { startTime: null },
              { startTime: { gte: new Date() } }
            ]
          }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        team: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      take: 5
    })
    
    console.log(`Dashboard query returned ${dashboardQuery.length} workouts:`)
    dashboardQuery.forEach(w => {
      console.log(`- ${w.title} (startTime: ${w.startTime})`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTrainings()
