import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function main() {
  console.log('🔍 Checking production workouts...\n')
  
  // Check total counts
  const workoutCount = await prisma.workout.count()
  const teamCount = await prisma.team.count()
  const userCount = await prisma.user.count()
  const memberCount = await prisma.teamMember.count()
  
  console.log('📊 Counts:')
  console.log(`   Workouts: ${workoutCount}`)
  console.log(`   Teams: ${teamCount}`)
  console.log(`   Users: ${userCount}`)
  console.log(`   Team Members: ${memberCount}\n`)
  
  // Check workouts by team
  const workoutsByTeam = await prisma.workout.groupBy({
    by: ['teamId'],
    _count: true
  })
  
  console.log('📋 Workouts by team:')
  for (const group of workoutsByTeam) {
    const team = group.teamId ? await prisma.team.findUnique({
      where: { id: group.teamId },
      select: { name: true }
    }) : null
    console.log(`   ${team?.name || 'No team'}: ${group._count} workouts`)
  }
  console.log()
  
  // Check sample workouts
  const sampleWorkouts = await prisma.workout.findMany({
    take: 5,
    include: {
      team: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true, email: true } }
    }
  })
  
  console.log('🔖 Sample workouts:')
  sampleWorkouts.forEach(w => {
    console.log(`   "${w.title}"`)
    console.log(`      Team: ${w.team?.name || 'None'}`)
    console.log(`      Creator: ${w.creator.name || w.creator.email}`)
    console.log(`      Public: ${w.isPublic}`)
    console.log()
  })
  
  // Check admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, email: true, name: true }
  })
  
  console.log('👤 Admin user:')
  console.log(`   ${admin?.name || admin?.email}`)
  console.log()
  
  // Check team memberships for admin
  if (admin) {
    const adminMemberships = await prisma.teamMember.findMany({
      where: { userId: admin.id },
      include: { team: { select: { name: true } } }
    })
    
    console.log(`📝 Admin team memberships: ${adminMemberships.length}`)
    adminMemberships.forEach(m => {
      console.log(`   - ${m.team.name} (${m.role})`)
    })
    console.log()
  }
  
  // Check a random player
  const player = await prisma.user.findFirst({
    where: { role: 'PLAYER' },
    select: { id: true, email: true, name: true }
  })
  
  if (player) {
    console.log('👤 Sample player:')
    console.log(`   ${player.name || player.email}`)
    
    const playerMemberships = await prisma.teamMember.findMany({
      where: { userId: player.id },
      include: { team: { select: { name: true } } }
    })
    
    console.log(`📝 Player team memberships: ${playerMemberships.length}`)
    playerMemberships.forEach(m => {
      console.log(`   - ${m.team.name} (${m.role})`)
    })
    
    // Check how many workouts this player should see
    const visibleWorkouts = await prisma.workout.findMany({
      where: {
        OR: [
          { creatorId: player.id },
          {
            team: {
              members: {
                some: { userId: player.id }
              }
            }
          }
        ]
      }
    })
    
    console.log(`👁️  Workouts visible to player: ${visibleWorkouts.length}`)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
