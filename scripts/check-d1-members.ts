import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking D1 team members...\n')
  
  const d1Team = await prisma.team.findFirst({
    where: { name: 'OPM Heerenveen D1' },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { role: 'asc' }
      }
    }
  })

  if (!d1Team) {
    console.log('D1 team not found!')
    return
  }

  console.log(`Team: ${d1Team.name}`)
  console.log(`Total members: ${d1Team.members.length}\n`)
  
  console.log('Members by role:')
  console.log('─'.repeat(80))
  
  d1Team.members.forEach(member => {
    console.log(`${member.role.padEnd(20)} | ${(member.user.name || 'No name').padEnd(25)} | ${member.user.email}`)
  })
  
  console.log('\nLooking for Klaas Talsma specifically...')
  const klaas = d1Team.members.find(m => 
    m.user.email === 'kltalsma@gmail.com' || 
    m.user.name?.includes('Klaas')
  )
  
  if (klaas) {
    console.log(`❌ FOUND: Klaas is a member with role: ${klaas.role}`)
  } else {
    console.log('✅ Klaas is NOT a member of D1 (correct!)')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
