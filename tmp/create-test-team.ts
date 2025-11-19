import { prisma } from '../src/lib/prisma'

async function createTestTeam() {
  try {
    // Get volleyball sport
    const sport = await prisma.sport.findFirst({
      where: { name: { contains: 'Volleyball', mode: 'insensitive' } }
    })

    if (!sport) {
      console.error('❌ Volleyball sport not found')
      return
    }

    console.log('✓ Found sport:', sport.name, `(${sport.id})`)

    // Get a user to assign as coach
    const user = await prisma.user.findFirst()
    
    if (!user) {
      console.error('❌ No user found')
      return
    }

    console.log('✓ Found user:', user.name || user.email, `(${user.id})`)

    // Selected team data from Volleybal.nl API (MB 1 - first place team)
    const teamData = {
      name: 'OPM Heerenveen MB 1',
      description: '1e in Meiden B 1e Klasse K Eerste helft\nTeam: Meiden B 1\nImported from Volleybal.nl',
      sportId: sport.id,
      volleybalNlApiId: '/competitie/teams/ckl6f7m/meiden-b/1',
      volleybalNlClubId: 'ckl6f7m',
      volleybalNlCategory: 'meiden-b',
      volleybalNlTeamNumber: 1
    }

    console.log('\n📝 Creating team:', teamData.name)

    const team = await prisma.team.create({
      data: {
        ...teamData,
        members: {
          create: {
            userId: user.id,
            role: 'COACH'
          }
        }
      },
      include: {
        sport: true,
        members: {
          include: {
            user: true
          }
        }
      }
    })

    console.log('\n✅ Team created successfully!')
    console.log('   ID:', team.id)
    console.log('   Name:', team.name)
    console.log('   Description:', team.description)
    console.log('   Volleybal.nl API ID:', team.volleybalNlApiId)
    console.log('   Volleybal.nl Club ID:', team.volleybalNlClubId)
    console.log('   Volleybal.nl Category:', team.volleybalNlCategory)
    console.log('   Volleybal.nl Team Number:', team.volleybalNlTeamNumber)
    console.log('   Sport:', team.sport.name)
    console.log('   Coach:', team.members[0]?.user.name || team.members[0]?.user.email)
    console.log('\n🔗 View team at: http://localhost:3000/teams/' + team.id)

  } catch (error) {
    console.error('❌ Error creating team:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestTeam()
