import { prisma } from '../src/lib/prisma'

async function cleanupOrphanedTeams() {
  try {
    console.log('🔍 Looking for orphaned teams (teams with no members)...\n')

    // Find teams with no members
    const orphanedTeams = await prisma.team.findMany({
      where: {
        members: {
          none: {}
        }
      },
      include: {
        sport: true,
        _count: {
          select: {
            workouts: true,
            trainingSessions: true
          }
        }
      }
    })

    if (orphanedTeams.length === 0) {
      console.log('✅ No orphaned teams found. Database is clean!')
      return
    }

    console.log(`Found ${orphanedTeams.length} orphaned team(s):\n`)

    for (const team of orphanedTeams) {
      console.log(`📋 Team: ${team.name}`)
      console.log(`   ID: ${team.id}`)
      console.log(`   Sport: ${team.sport.name}`)
      console.log(`   Workouts: ${team._count.workouts}`)
      console.log(`   Training Sessions: ${team._count.trainingSessions}`)
      if (team.volleybalNlApiId) {
        console.log(`   Volleybal.nl: ${team.volleybalNlApiId}`)
      }
      console.log()
    }

    console.log('🗑️  Deleting orphaned teams...\n')

    const result = await prisma.team.deleteMany({
      where: {
        members: {
          none: {}
        }
      }
    })

    console.log(`✅ Deleted ${result.count} orphaned team(s)`)

  } catch (error) {
    console.error('❌ Error cleaning up orphaned teams:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupOrphanedTeams()
