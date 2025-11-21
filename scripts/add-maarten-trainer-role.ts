import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Find Maarten
  const user = await prisma.user.findUnique({
    where: { email: 'maarten.opm@opmheerenveen.nl' }
  })

  if (!user) {
    console.log('❌ User not found')
    return
  }

  // Find D2 team
  const team = await prisma.team.findFirst({
    where: { name: { contains: 'D2' } }
  })

  if (!team) {
    console.log('❌ Team not found')
    return
  }

  console.log(`Adding TRAINER role for ${user.name} on ${team.name}...`)

  // Check if already has TRAINER role
  const existing = await prisma.teamMember.findFirst({
    where: {
      teamId: team.id,
      userId: user.id,
      role: 'TRAINER'
    }
  })

  if (existing) {
    console.log('✅ User already has TRAINER role on this team')
    return
  }

  // Add TRAINER role
  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: user.id,
      role: 'TRAINER'
    }
  })

  console.log('✅ Successfully added TRAINER role')
  console.log('\nCurrent roles for user on team:')
  
  const allRoles = await prisma.teamMember.findMany({
    where: {
      teamId: team.id,
      userId: user.id
    }
  })

  allRoles.forEach(role => {
    console.log(`  - ${role.role}`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
