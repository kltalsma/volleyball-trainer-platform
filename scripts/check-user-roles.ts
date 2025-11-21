import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'maarten.opm@opmheerenveen.nl' },
    include: {
      teams: {
        include: {
          team: {
            select: {
              name: true,
              sport: { select: { name: true } }
            }
          }
        }
      }
    }
  })

  if (!user) {
    console.log('User not found')
    return
  }

  console.log('\nUser:', user.name)
  console.log('Email:', user.email)
  console.log('Global Role:', user.role)
  console.log('\nTeam Memberships:')
  
  user.teams.forEach((membership) => {
    console.log(`  - ${membership.team.name} (${membership.team.sport.name})`)
    console.log(`    Role: ${membership.role}`)
    console.log(`    Number: ${membership.number || 'N/A'}`)
    console.log(`    Position: ${membership.position || 'N/A'}`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
