import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Create sports
  const volleyball = await prisma.sport.upsert({
    where: { slug: 'volleyball' },
    update: {},
    create: {
      name: 'Volleyball',
      slug: 'volleyball',
      icon: '🏐',
      active: true,
    },
  })

  const beachVolleyball = await prisma.sport.upsert({
    where: { slug: 'beach-volleyball' },
    update: {},
    create: {
      name: 'Beach Volleyball',
      slug: 'beach-volleyball',
      icon: '🏖️',
      active: true,
    },
  })

  // Mark non-volleyball sports as inactive
  const soccer = await prisma.sport.upsert({
    where: { slug: 'soccer' },
    update: { active: false },
    create: {
      name: 'Soccer',
      slug: 'soccer',
      icon: '⚽',
      active: false,
    },
  })

  const basketball = await prisma.sport.upsert({
    where: { slug: 'basketball' },
    update: { active: false },
    create: {
      name: 'Basketball',
      slug: 'basketball',
      icon: '🏀',
      active: false,
    },
  })

  console.log({ volleyball, beachVolleyball, soccer, basketball })

  // Create exercise categories
  const warmUp = await prisma.exerciseCategory.upsert({
    where: { slug: 'warm-up' },
    update: {},
    create: {
      name: 'Warm-up',
      slug: 'warm-up',
    },
  })

  const technical = await prisma.exerciseCategory.upsert({
    where: { slug: 'technical' },
    update: {},
    create: {
      name: 'Technical',
      slug: 'technical',
    },
  })

  const tactical = await prisma.exerciseCategory.upsert({
    where: { slug: 'tactical' },
    update: {},
    create: {
      name: 'Tactical',
      slug: 'tactical',
    },
  })

  const physical = await prisma.exerciseCategory.upsert({
    where: { slug: 'physical' },
    update: {},
    create: {
      name: 'Physical',
      slug: 'physical',
    },
  })

  const coolDown = await prisma.exerciseCategory.upsert({
    where: { slug: 'cool-down' },
    update: {},
    create: {
      name: 'Cool-down',
      slug: 'cool-down',
    },
  })

  console.log({ warmUp, technical, tactical, physical, coolDown })

  console.log('Seeding finished.')
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
