import { PrismaClient, UserRole, MemberRole, Difficulty, SkillLevel, SessionStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Start seeding...')

  // Create sports
  console.log('📊 Creating sports...')
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

  // Create exercise categories
  console.log('📁 Creating exercise categories...')
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

  const gamePlay = await prisma.exerciseCategory.upsert({
    where: { slug: 'game-play' },
    update: {},
    create: {
      name: 'Game Play',
      slug: 'game-play',
    },
  })

  // Create users
  console.log('👥 Creating users...')
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Admin user (preserved from original)
  const klaas = await prisma.user.upsert({
    where: { email: 'kltalsma@gmail.com' },
    update: {
      role: UserRole.ADMIN,
    },
    create: {
      email: 'kltalsma@gmail.com',
      name: 'Klaas Talsma',
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  })

  // Helper function to create user
  async function createUser(name: string, role: UserRole = UserRole.PLAYER) {
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@opmheerenveen.nl`
    return await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        password: hashedPassword,
        role,
      },
    })
  }

  // Create all players from OPM teams
  console.log('Creating H1 players...')
  const h1Players = {
    ruurdZwigt: await createUser('Ruurd Zwigt'),
    tjeukeHorsten: await createUser('Tjeuke Horsten'),
    markRemmelts: await createUser('Mark Remmelts'),
    nannePopma: await createUser('Nanne Popma'),
    harryRemmelts: await createUser('Harry Remmelts'),
    teakeDeBoer: await createUser('Teake de Boer'),
    daveBusstra: await createUser('Dave Busstra'),
    luukDeGoede: await createUser('Luuk de Goede'),
    wimLont: await createUser('Wim Lont'),
    tonScheeringa: await createUser('Ton Scheeringa'),
    gerritVisser: await createUser('Gerrit Visser'),
  }

  console.log('Creating H2 players...')
  const h2Players = {
    hermanMiedema: await createUser('Herman Miedema'),
    jetzeDeJong: await createUser('Jetze de Jong'),
    sanderStamhuis: await createUser('Sander Stamhuis'),
    basRoelfsema: await createUser('Bas Roelfsema'),
    wiepVisser: await createUser('Wiep Visser'),
    jentsjeDeGlee: await createUser('Jentsje de Glee'),
    wimVanDijk: await createUser('Wim van Dijk'),
    ronVanDerMeer: await createUser('Ron van der Meer'),
    janMartenRegeling: await createUser('Jan Marten Regeling'),
    roelVanEe: await createUser('Roel van Ee'),
  }

  console.log('Creating D1 players...')
  const d1Players = {
    irisDeJonge: await createUser('Iris de Jonge'),
    leonieMendel: await createUser('Leonie Mendel'),
    marritSikkema: await createUser('Marrit Sikkema'),
    lotteFeenstra: await createUser('Lotte Feenstra'),
    elineNijmeijer: await createUser('Eline Nijmeijer'),
    tessLand: await createUser('Tess Land'),
    jasmijnVerwindt: await createUser('Jasmijn Verwindt'),
    nienkeVanDerSchuit: await createUser('Nienke van der Schuit'),
    susanHeida: await createUser('Susan Heida'),
    meikeKramer: await createUser('Meike Kramer'),
    henriekeWalraven: await createUser('Henrieke Walraven'),
    dorienSlats: await createUser('Dorien Slats'),
  }

  console.log('Creating D2 players...')
  const d2Players = {
    sBusstra: await createUser('S. Busstra'),
    marlinJongsma: await createUser('Marlin Jongsma'),
    brendaDeJong: await createUser('Brenda de Jong'),
    janeEnjoem: await createUser('Jane Enjoem'),
    leandraCarvalho: await createUser('Leandra Carvalho'),
    irmaVeenstra: await createUser('Irma Veenstra'),
    lotteGras: await createUser('Lotte Gras'),
    femkeKnijn: await createUser('Femke Knijn'),
    amarinsJonkman: await createUser('Amarins Jonkman'),
    ileneKampherbeek: await createUser('Ilene Kampherbeek'),
  }

  console.log('Creating D4 players...')
  const d4Players = {
    levyAtsma: await createUser('Levy Atsma'),
    benteJonkman: await createUser('Bente Jonkman'),
    nynkeBosga: await createUser('Nynke Bosga'),
    mirtheOosterhof: await createUser('Mirthe Oosterhof'),
    myrtheVanDixhoorn: await createUser('Myrthe van Dixhoorn'),
    elineDeJong: await createUser('Eline de Jong'),
    roelieVanDerMolen: await createUser('Roelie van der Molen'),
    anneliesOenema: await createUser('Annelies Oenema'),
    kirsaVanDijk: await createUser('Kirsa van Dijk'),
  }

  console.log('Creating Special Ladies players...')
  const specialLadiesPlayers = {
    rixtAnnaBos: await createUser('Rixt Anna Bos'),
    marjanYtsma: await createUser('Marjan Ytsma'),
    marjanScheepers: await createUser('Marjan Scheepers'),
    christaSangers: await createUser('Christa Sangers'),
    nynkeHoekstra: await createUser('Nynke Hoekstra'),
    stefanieVanWees: await createUser('Stefanie van Wees'),
    hillyPolstra: await createUser('Hilly Polstra'),
    maaikeBosma: await createUser('Maaike Bosma'),
  }

  console.log('Creating MA1 players...')
  const ma1Players = {
    femkeAgricola: await createUser('Femke Agricola'),
    sarahBevelander: await createUser('Sarah Bevelander'),
    yenteBoringa: await createUser('Yente Boringa'),
    jorijnKooistra: await createUser('Jorijn Kooistra'),
    melanieMulder: await createUser('Melanie Mulder'),
    zuziaSikorska: await createUser('Zuzia Sikorska'),
  }

  console.log('Creating MB1/MB2 players...')
  const mbPlayers = {
    tessDeVries: await createUser('Tess de Vries'),
    evaHaitsma: await createUser('Eva Haitsma'),
    pienJansen: await createUser('Pien Jansen'),
    silkeLand: await createUser('Silke Land'),
    laraMitrovic: await createUser('Lara Mitrovic'),
    zosiaPawlowski: await createUser('Zosia Pawlowski'),
    dyckeTalsma: await createUser('Dycke Talsma'),
    tanishaTuinsta: await createUser('Tanisha Tuinsta'),
    esmeeWalstra: await createUser('Esmee Walstra'),
  }

  console.log('Creating XC1 players...')
  const xc1Players = {
    elyseBekkema: await createUser('Elyse Bekkema'),
    aaronMuizelaar: await createUser('Aaron Muizelaar'),
    jorritBrandes: await createUser('Jorrit Brandes'),
    fennaHaitsma: await createUser('Fenna Haitsma'),
    sofieKranen: await createUser('Sofie Kranen'),
    jasperLont: await createUser('Jasper Lont'),
    lotteMarks: await createUser('Lotte Marks'),
    mariekeTiemersma: await createUser('Marieke Tiemersma'),
    laraAziz: await createUser('Lara Aziz'),
  }

  console.log('Creating XC2 players...')
  const xc2Players = {
    emmaBouma: await createUser('Emma Bouma'),
    tanischaVisser: await createUser('Tanischa Visser'),
    vereWiersma: await createUser('Vere Wiersma'),
    nielsBosma: await createUser('Niels Bosma'),
    tymofiHasnikov: await createUser('Tymofii Hasnikov'),
    aaronTerpyak: await createUser('Aaron Terpyak'),
    rienkFekken: await createUser('Rienk Fekken'),
    mykaVerhallen: await createUser('Myka Verhallen'),
  }

  const totalPlayers = Object.keys(h1Players).length + Object.keys(h2Players).length + 
                       Object.keys(d1Players).length + Object.keys(d2Players).length + 
                       Object.keys(d4Players).length + Object.keys(specialLadiesPlayers).length +
                       Object.keys(ma1Players).length + Object.keys(mbPlayers).length +
                       Object.keys(xc1Players).length + Object.keys(xc2Players).length
  console.log(`✅ Created ${totalPlayers} players`)

  // Create teams
  console.log('🏐 Creating teams...')
  
  // Check if teams already exist
  const existingTeamsCount = await prisma.team.count()
  if (existingTeamsCount > 0) {
    console.log(`⏭️  Skipping teams creation - ${existingTeamsCount} teams already exist`)
    console.log('\n🎉 Seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   • ${await prisma.user.count()} users`)
    console.log(`   • ${await prisma.team.count()} teams`)
    console.log(`   • ${await prisma.exercise.count()} exercises`)
    console.log('\n🔐 Login credentials:')
    console.log('   Admin: kltalsma@gmail.com / password123')
    console.log('   All players: <firstname>.<lastname>@opmheerenveen.nl / password123')
    return
  }
  
  const h1 = await prisma.team.create({
    data: {
      name: 'OPM Heerenveen H1',
      description: 'Heren 1 - Promotie klasse',
      sportId: volleyball.id,
      creatorId: klaas.id,
      volleybalNlClubId: 'ckl6f7m',
      volleybalNlCategory: 'heren',
      volleybalNlTeamNumber: 1,
    },
  })

  const h2 = await prisma.team.create({
    data: {
      name: 'OPM Heerenveen H2',
      description: 'Heren 2 - Derde klasse',
      sportId: volleyball.id,
      creatorId: klaas.id,
      volleybalNlClubId: 'ckl6f7m',
      volleybalNlCategory: 'heren',
      volleybalNlTeamNumber: 3,
    },
  })

  const d1 = await prisma.team.create({
    data: {
      name: 'OPM Heerenveen D1',
      description: 'Dames 1 - Eerste klasse',
      sportId: volleyball.id,
      creatorId: klaas.id,
      volleybalNlClubId: 'ckl6f7m',
      volleybalNlCategory: 'dames',
      volleybalNlTeamNumber: 1,
    },
  })

  const d2 = await prisma.team.create({
    data: {
      name: 'OPM Heerenveen D2',
      description: 'Dames 2 - Tweede klasse',
      sportId: volleyball.id,
      creatorId: klaas.id,
      volleybalNlClubId: 'ckl6f7m',
      volleybalNlCategory: 'dames',
      volleybalNlTeamNumber: 2,
    },
  })

  const d4 = await prisma.team.create({
    data: {
      name: 'OPM Heerenveen D4',
      description: 'Dames 4 - Vierde klasse',
      sportId: volleyball.id,
      creatorId: klaas.id,
      volleybalNlClubId: 'ckl6f7m',
      volleybalNlCategory: 'dames',
      volleybalNlTeamNumber: 3,
    },
  })

  const specialLadies = await prisma.team.create({
    data: {
      name: 'Special Ladies',
      description: 'Mastercompetitie',
      sportId: volleyball.id,
      creatorId: klaas.id,
      volleybalNlClubId: 'ckl6f7m',
      volleybalNlCategory: 'dames-master',
      volleybalNlTeamNumber: 1,
    },
  })

  const ma1 = await prisma.team.create({
    data: {
      name: 'OPM Heerenveen MA1',
      description: 'Meisjes A1 - Tweede klasse',
      sportId: volleyball.id,
      creatorId: klaas.id,
      volleybalNlClubId: 'ckl6f7m',
      volleybalNlCategory: 'meisjes-a',
      volleybalNlTeamNumber: 1,
    },
  })

  const mb1 = await prisma.team.create({
    data: {
      name: 'OPM Heerenveen MB1',
      description: 'Meisjes B1 - Eerste klasse',
      sportId: volleyball.id,
      creatorId: klaas.id,
      volleybalNlClubId: 'ckl6f7m',
      volleybalNlCategory: 'meisjes-b',
      volleybalNlTeamNumber: 1,
    },
  })

  const mb2 = await prisma.team.create({
    data: {
      name: 'OPM Heerenveen MB2',
      description: 'Meisjes B2 - Eerste klasse',
      sportId: volleyball.id,
      creatorId: klaas.id,
      volleybalNlClubId: 'ckl6f7m',
      volleybalNlCategory: 'meisjes-b',
      volleybalNlTeamNumber: 2,
    },
  })

  const xc1 = await prisma.team.create({
    data: {
      name: 'OPM Heerenveen XC1',
      description: 'Mix C1 - Eerste klasse',
      sportId: volleyball.id,
      creatorId: klaas.id,
      volleybalNlClubId: 'ckl6f7m',
      volleybalNlCategory: 'mixed-c',
      volleybalNlTeamNumber: 1,
    },
  })

  const xc2 = await prisma.team.create({
    data: {
      name: 'OPM Heerenveen XC2',
      description: 'Mix C2 - Tweede klasse',
      sportId: volleyball.id,
      creatorId: klaas.id,
      volleybalNlClubId: 'ckl6f7m',
      volleybalNlCategory: 'mixed-c',
      volleybalNlTeamNumber: 2,
    },
  })

  // Add team members
  console.log('👫 Adding team members...')
  
  // H1 team members - Admin as coach
  await prisma.teamMember.createMany({
    data: [
      { teamId: h1.id, userId: klaas.id, role: MemberRole.COACH },
      { teamId: h1.id, userId: h1Players.ruurdZwigt.id, role: MemberRole.PLAYER, number: 1, position: 'Opposite' },
      { teamId: h1.id, userId: h1Players.tjeukeHorsten.id, role: MemberRole.PLAYER, number: 2, position: 'Middle Blocker' },
      { teamId: h1.id, userId: h1Players.markRemmelts.id, role: MemberRole.PLAYER, number: 3, position: 'Outside Hitter' },
      { teamId: h1.id, userId: h1Players.nannePopma.id, role: MemberRole.PLAYER, number: 4, position: 'Outside Hitter' },
      { teamId: h1.id, userId: h1Players.harryRemmelts.id, role: MemberRole.PLAYER, number: 5, position: 'Setter' },
      { teamId: h1.id, userId: h1Players.teakeDeBoer.id, role: MemberRole.PLAYER, number: 6, position: 'Middle Blocker' },
      { teamId: h1.id, userId: h1Players.daveBusstra.id, role: MemberRole.PLAYER, number: 7, position: 'Opposite' },
      { teamId: h1.id, userId: h1Players.luukDeGoede.id, role: MemberRole.PLAYER, number: 8, position: 'Setter' },
      { teamId: h1.id, userId: h1Players.wimLont.id, role: MemberRole.PLAYER, number: 9, position: 'Outside Hitter' },
      { teamId: h1.id, userId: h1Players.tonScheeringa.id, role: MemberRole.PLAYER, number: 10, position: 'Libero' },
      { teamId: h1.id, userId: h1Players.gerritVisser.id, role: MemberRole.PLAYER, number: 11, position: 'Middle Blocker' },
    ],
  })

  // H2 team members
  await prisma.teamMember.createMany({
    data: [
      { teamId: h2.id, userId: klaas.id, role: MemberRole.COACH },
      { teamId: h2.id, userId: h2Players.hermanMiedema.id, role: MemberRole.PLAYER, number: 1 },
      { teamId: h2.id, userId: h2Players.jetzeDeJong.id, role: MemberRole.PLAYER, number: 2 },
      { teamId: h2.id, userId: h2Players.sanderStamhuis.id, role: MemberRole.PLAYER, number: 3 },
      { teamId: h2.id, userId: h2Players.basRoelfsema.id, role: MemberRole.PLAYER, number: 4 },
      { teamId: h2.id, userId: h2Players.wiepVisser.id, role: MemberRole.PLAYER, number: 5 },
      { teamId: h2.id, userId: h2Players.jentsjeDeGlee.id, role: MemberRole.PLAYER, number: 6 },
      { teamId: h2.id, userId: h2Players.wimVanDijk.id, role: MemberRole.PLAYER, number: 7 },
      { teamId: h2.id, userId: h2Players.ronVanDerMeer.id, role: MemberRole.PLAYER, number: 8 },
      { teamId: h2.id, userId: h2Players.janMartenRegeling.id, role: MemberRole.PLAYER, number: 9 },
      { teamId: h2.id, userId: h2Players.roelVanEe.id, role: MemberRole.PLAYER, number: 10 },
    ],
  })

  // D1 team members
  await prisma.teamMember.createMany({
    data: [
      { teamId: d1.id, userId: klaas.id, role: MemberRole.COACH },
      { teamId: d1.id, userId: d1Players.irisDeJonge.id, role: MemberRole.PLAYER, number: 1, position: 'Libero' },
      { teamId: d1.id, userId: d1Players.leonieMendel.id, role: MemberRole.PLAYER, number: 2, position: 'Outside Hitter' },
      { teamId: d1.id, userId: d1Players.marritSikkema.id, role: MemberRole.PLAYER, number: 3, position: 'Setter' },
      { teamId: d1.id, userId: d1Players.lotteFeenstra.id, role: MemberRole.PLAYER, number: 4, position: 'Outside Hitter' },
      { teamId: d1.id, userId: d1Players.elineNijmeijer.id, role: MemberRole.PLAYER, number: 5, position: 'Outside Hitter' },
      { teamId: d1.id, userId: d1Players.tessLand.id, role: MemberRole.PLAYER, number: 6, position: 'Middle Blocker' },
      { teamId: d1.id, userId: d1Players.jasmijnVerwindt.id, role: MemberRole.PLAYER, number: 7, position: 'Opposite' },
      { teamId: d1.id, userId: d1Players.nienkeVanDerSchuit.id, role: MemberRole.PLAYER, number: 8, position: 'Opposite' },
      { teamId: d1.id, userId: d1Players.susanHeida.id, role: MemberRole.PLAYER, number: 9, position: 'Outside Hitter' },
      { teamId: d1.id, userId: d1Players.meikeKramer.id, role: MemberRole.PLAYER, number: 10, position: 'Middle Blocker' },
      { teamId: d1.id, userId: d1Players.henriekeWalraven.id, role: MemberRole.PLAYER, number: 11, position: 'Setter' },
      { teamId: d1.id, userId: d1Players.dorienSlats.id, role: MemberRole.PLAYER, number: 12, position: 'Setter' },
    ],
  })

  // D2 team members
  await prisma.teamMember.createMany({
    data: [
      { teamId: d2.id, userId: klaas.id, role: MemberRole.COACH },
      { teamId: d2.id, userId: d2Players.sBusstra.id, role: MemberRole.PLAYER, number: 1, position: 'Setter' },
      { teamId: d2.id, userId: d2Players.marlinJongsma.id, role: MemberRole.PLAYER, number: 2, position: 'Opposite' },
      { teamId: d2.id, userId: d2Players.brendaDeJong.id, role: MemberRole.PLAYER, number: 3, position: 'Middle Blocker' },
      { teamId: d2.id, userId: d2Players.janeEnjoem.id, role: MemberRole.PLAYER, number: 4, position: 'Middle Blocker' },
      { teamId: d2.id, userId: d2Players.leandraCarvalho.id, role: MemberRole.PLAYER, number: 5, position: 'Outside Hitter' },
      { teamId: d2.id, userId: d2Players.irmaVeenstra.id, role: MemberRole.PLAYER, number: 6, position: 'Setter' },
      { teamId: d2.id, userId: d2Players.lotteGras.id, role: MemberRole.PLAYER, number: 7, position: 'Outside Hitter' },
      { teamId: d2.id, userId: d2Players.femkeKnijn.id, role: MemberRole.PLAYER, number: 8, position: 'Middle Blocker' },
      { teamId: d2.id, userId: d2Players.amarinsJonkman.id, role: MemberRole.PLAYER, number: 9, position: 'Opposite' },
      { teamId: d2.id, userId: d2Players.ileneKampherbeek.id, role: MemberRole.PLAYER, number: 10, position: 'Outside Hitter' },
    ],
  })

  // D4 team members
  await prisma.teamMember.createMany({
    data: [
      { teamId: d4.id, userId: klaas.id, role: MemberRole.COACH },
      { teamId: d4.id, userId: d4Players.levyAtsma.id, role: MemberRole.PLAYER, number: 1, position: 'Setter' },
      { teamId: d4.id, userId: d4Players.benteJonkman.id, role: MemberRole.PLAYER, number: 2, position: 'Middle Blocker' },
      { teamId: d4.id, userId: d4Players.nynkeBosga.id, role: MemberRole.PLAYER, number: 3, position: 'Outside Hitter' },
      { teamId: d4.id, userId: d4Players.mirtheOosterhof.id, role: MemberRole.PLAYER, number: 4, position: 'Outside Hitter' },
      { teamId: d4.id, userId: d4Players.myrtheVanDixhoorn.id, role: MemberRole.PLAYER, number: 5 },
      { teamId: d4.id, userId: d4Players.elineDeJong.id, role: MemberRole.PLAYER, number: 6, position: 'Setter' },
      { teamId: d4.id, userId: d4Players.roelieVanDerMolen.id, role: MemberRole.PLAYER, number: 7, position: 'Middle Blocker' },
      { teamId: d4.id, userId: d4Players.anneliesOenema.id, role: MemberRole.PLAYER, number: 8, position: 'Middle Blocker' },
      { teamId: d4.id, userId: d4Players.kirsaVanDijk.id, role: MemberRole.PLAYER, number: 9, position: 'Outside Hitter' },
    ],
  })

  // Special Ladies team members
  await prisma.teamMember.createMany({
    data: [
      { teamId: specialLadies.id, userId: klaas.id, role: MemberRole.COACH },
      { teamId: specialLadies.id, userId: specialLadiesPlayers.rixtAnnaBos.id, role: MemberRole.PLAYER, number: 1 },
      { teamId: specialLadies.id, userId: specialLadiesPlayers.marjanYtsma.id, role: MemberRole.PLAYER, number: 2, position: 'Outside Hitter' },
      { teamId: specialLadies.id, userId: specialLadiesPlayers.marjanScheepers.id, role: MemberRole.PLAYER, number: 3, position: 'Outside Hitter' },
      { teamId: specialLadies.id, userId: specialLadiesPlayers.christaSangers.id, role: MemberRole.PLAYER, number: 4, position: 'Middle Blocker' },
      { teamId: specialLadies.id, userId: specialLadiesPlayers.nynkeHoekstra.id, role: MemberRole.PLAYER, number: 5, position: 'Outside Hitter' },
      { teamId: specialLadies.id, userId: specialLadiesPlayers.stefanieVanWees.id, role: MemberRole.PLAYER, number: 6, position: 'Outside Hitter' },
      { teamId: specialLadies.id, userId: specialLadiesPlayers.hillyPolstra.id, role: MemberRole.PLAYER, number: 7, position: 'Middle Blocker' },
      { teamId: specialLadies.id, userId: specialLadiesPlayers.maaikeBosma.id, role: MemberRole.PLAYER, number: 8, position: 'Middle Blocker' },
    ],
  })

  // MA1 team members
  await prisma.teamMember.createMany({
    data: [
      { teamId: ma1.id, userId: klaas.id, role: MemberRole.COACH },
      { teamId: ma1.id, userId: ma1Players.femkeAgricola.id, role: MemberRole.PLAYER, number: 1 },
      { teamId: ma1.id, userId: ma1Players.sarahBevelander.id, role: MemberRole.PLAYER, number: 2 },
      { teamId: ma1.id, userId: ma1Players.yenteBoringa.id, role: MemberRole.PLAYER, number: 3 },
      { teamId: ma1.id, userId: ma1Players.jorijnKooistra.id, role: MemberRole.PLAYER, number: 4 },
      { teamId: ma1.id, userId: ma1Players.melanieMulder.id, role: MemberRole.PLAYER, number: 5 },
      { teamId: ma1.id, userId: ma1Players.zuziaSikorska.id, role: MemberRole.PLAYER, number: 6 },
    ],
  })

  // MB1 team members
  await prisma.teamMember.createMany({
    data: [
      { teamId: mb1.id, userId: klaas.id, role: MemberRole.COACH },
      { teamId: mb1.id, userId: mbPlayers.tessDeVries.id, role: MemberRole.PLAYER, number: 1 },
      { teamId: mb1.id, userId: mbPlayers.evaHaitsma.id, role: MemberRole.PLAYER, number: 2, position: 'Outside Hitter' },
      { teamId: mb1.id, userId: mbPlayers.pienJansen.id, role: MemberRole.PLAYER, number: 3, position: 'Outside Hitter' },
      { teamId: mb1.id, userId: mbPlayers.silkeLand.id, role: MemberRole.PLAYER, number: 4, position: 'Middle Blocker' },
      { teamId: mb1.id, userId: mbPlayers.laraMitrovic.id, role: MemberRole.PLAYER, number: 5, position: 'Setter' },
      { teamId: mb1.id, userId: mbPlayers.zosiaPawlowski.id, role: MemberRole.PLAYER, number: 6, position: 'Setter' },
      { teamId: mb1.id, userId: mbPlayers.dyckeTalsma.id, role: MemberRole.PLAYER, number: 7, position: 'Middle Blocker' },
      { teamId: mb1.id, userId: mbPlayers.tanishaTuinsta.id, role: MemberRole.PLAYER, number: 8, position: 'Outside Hitter' },
      { teamId: mb1.id, userId: mbPlayers.esmeeWalstra.id, role: MemberRole.PLAYER, number: 9 },
    ],
  })

  // MB2 team members (same players as MB1)
  await prisma.teamMember.createMany({
    data: [
      { teamId: mb2.id, userId: klaas.id, role: MemberRole.COACH },
      { teamId: mb2.id, userId: mbPlayers.tessDeVries.id, role: MemberRole.PLAYER, number: 1 },
      { teamId: mb2.id, userId: mbPlayers.evaHaitsma.id, role: MemberRole.PLAYER, number: 2, position: 'Outside Hitter' },
      { teamId: mb2.id, userId: mbPlayers.pienJansen.id, role: MemberRole.PLAYER, number: 3, position: 'Outside Hitter' },
      { teamId: mb2.id, userId: mbPlayers.silkeLand.id, role: MemberRole.PLAYER, number: 4, position: 'Middle Blocker' },
      { teamId: mb2.id, userId: mbPlayers.laraMitrovic.id, role: MemberRole.PLAYER, number: 5, position: 'Setter' },
      { teamId: mb2.id, userId: mbPlayers.zosiaPawlowski.id, role: MemberRole.PLAYER, number: 6, position: 'Setter' },
      { teamId: mb2.id, userId: mbPlayers.dyckeTalsma.id, role: MemberRole.PLAYER, number: 7, position: 'Middle Blocker' },
      { teamId: mb2.id, userId: mbPlayers.tanishaTuinsta.id, role: MemberRole.PLAYER, number: 8, position: 'Outside Hitter' },
      { teamId: mb2.id, userId: mbPlayers.esmeeWalstra.id, role: MemberRole.PLAYER, number: 9 },
    ],
  })

  // XC1 team members
  await prisma.teamMember.createMany({
    data: [
      { teamId: xc1.id, userId: klaas.id, role: MemberRole.COACH },
      { teamId: xc1.id, userId: xc1Players.elyseBekkema.id, role: MemberRole.PLAYER, number: 1 },
      { teamId: xc1.id, userId: xc1Players.aaronMuizelaar.id, role: MemberRole.PLAYER, number: 2 },
      { teamId: xc1.id, userId: xc1Players.jorritBrandes.id, role: MemberRole.PLAYER, number: 3 },
      { teamId: xc1.id, userId: xc1Players.fennaHaitsma.id, role: MemberRole.PLAYER, number: 4 },
      { teamId: xc1.id, userId: xc1Players.sofieKranen.id, role: MemberRole.PLAYER, number: 5 },
      { teamId: xc1.id, userId: xc1Players.jasperLont.id, role: MemberRole.PLAYER, number: 6 },
      { teamId: xc1.id, userId: xc1Players.lotteMarks.id, role: MemberRole.PLAYER, number: 7 },
      { teamId: xc1.id, userId: xc1Players.mariekeTiemersma.id, role: MemberRole.PLAYER, number: 8 },
      { teamId: xc1.id, userId: xc1Players.laraAziz.id, role: MemberRole.PLAYER, number: 9 },
    ],
  })

  // XC2 team members
  await prisma.teamMember.createMany({
    data: [
      { teamId: xc2.id, userId: klaas.id, role: MemberRole.COACH },
      { teamId: xc2.id, userId: xc2Players.emmaBouma.id, role: MemberRole.PLAYER, number: 1 },
      { teamId: xc2.id, userId: xc2Players.tanischaVisser.id, role: MemberRole.PLAYER, number: 2 },
      { teamId: xc2.id, userId: xc2Players.vereWiersma.id, role: MemberRole.PLAYER, number: 3 },
      { teamId: xc2.id, userId: xc2Players.nielsBosma.id, role: MemberRole.PLAYER, number: 4 },
      { teamId: xc2.id, userId: xc2Players.tymofiHasnikov.id, role: MemberRole.PLAYER, number: 5 },
      { teamId: xc2.id, userId: xc2Players.aaronTerpyak.id, role: MemberRole.PLAYER, number: 6 },
      { teamId: xc2.id, userId: xc2Players.rienkFekken.id, role: MemberRole.PLAYER, number: 7 },
      { teamId: xc2.id, userId: xc2Players.mykaVerhallen.id, role: MemberRole.PLAYER, number: 8 },
    ],
  })

  // Create exercises
  console.log('🏋️ Creating exercises...')
  
  const exercises = await prisma.exercise.createMany({
    data: [
      // Warm-up exercises
      {
        title: 'Dynamic Stretching Routine',
        description: 'Full body dynamic stretching focusing on shoulders, hips, and legs. Include arm circles, leg swings, and torso rotations.',
        duration: 10,
        difficulty: Difficulty.EASY,
        sportId: volleyball.id,
        categoryId: warmUp.id,
        creatorId: klaas.id,
        isPublic: true,
        techniques: ['mobility', 'flexibility'],
        playerMin: 1,
        playerMax: 20,
        skillLevel: SkillLevel.BEGINNER,
        tags: ['stretching', 'warm-up', 'flexibility'],
      },
      {
        title: 'Pepper Drill',
        description: 'Partner passing drill. Players pass, set, and hit in continuous rhythm. Focus on ball control and communication.',
        duration: 15,
        difficulty: Difficulty.EASY,
        sportId: volleyball.id,
        categoryId: warmUp.id,
        creatorId: klaas.id,
        isPublic: true,
        techniques: ['pass', 'set', 'attack'],
        playerMin: 2,
        playerMax: 20,
        skillLevel: SkillLevel.BEGINNER,
        tags: ['passing', 'warm-up', 'partner-drill'],
      },
      
      // Technical exercises
      {
        title: 'Serving Accuracy Training',
        description: 'Target practice with different serving zones. Players must hit specific areas of the court consistently.',
        duration: 20,
        difficulty: Difficulty.MEDIUM,
        sportId: volleyball.id,
        categoryId: technical.id,
        creatorId: klaas.id,
        isPublic: true,
        techniques: ['serve'],
        playerMin: 1,
        playerMax: 12,
        skillLevel: SkillLevel.INTERMEDIATE,
        tags: ['serving', 'accuracy', 'technique'],
        materials: { items: [{ name: 'Cones', quantity: 6 }, { name: 'Balls', quantity: 12 }] },
      },
      {
        title: 'Setting Technique Progression',
        description: 'Progressive setting drills starting from wall sets, to partner sets, to movement sets. Focus on hand position and follow-through.',
        duration: 25,
        difficulty: Difficulty.MEDIUM,
        sportId: volleyball.id,
        categoryId: technical.id,
        creatorId: klaas.id,
        isPublic: true,
        techniques: ['set'],
        playerMin: 2,
        playerMax: 16,
        skillLevel: SkillLevel.INTERMEDIATE,
        tags: ['setting', 'technique', 'hands'],
      },
      {
        title: 'Attack Approach and Timing',
        description: 'Work on 3-step and 4-step approaches. Focus on timing with setter and explosive jump technique.',
        duration: 30,
        difficulty: Difficulty.HARD,
        sportId: volleyball.id,
        categoryId: technical.id,
        creatorId: klaas.id,
        isPublic: true,
        techniques: ['attack'],
        playerMin: 3,
        playerMax: 12,
        skillLevel: SkillLevel.ADVANCED,
        tags: ['attacking', 'timing', 'approach'],
      },
      {
        title: 'Blocking Footwork and Positioning',
        description: 'Middle blocker movement patterns along the net. Quick side-steps and reading the setter.',
        duration: 20,
        difficulty: Difficulty.MEDIUM,
        sportId: volleyball.id,
        categoryId: technical.id,
        creatorId: klaas.id,
        isPublic: true,
        techniques: ['block'],
        playerMin: 2,
        playerMax: 9,
        skillLevel: SkillLevel.INTERMEDIATE,
        tags: ['blocking', 'footwork', 'reading'],
      },
      {
        title: 'Defensive Dig Technique',
        description: 'Low platform technique for hard-driven balls. Partner hits from box, defender digs to target.',
        duration: 20,
        difficulty: Difficulty.MEDIUM,
        sportId: volleyball.id,
        categoryId: technical.id,
        creatorId: klaas.id,
        isPublic: true,
        techniques: ['defense', 'pass'],
        playerMin: 2,
        playerMax: 12,
        skillLevel: SkillLevel.INTERMEDIATE,
        tags: ['defense', 'digging', 'platform'],
      },
      
      // Tactical exercises
      {
        title: 'Serve Receive Formations',
        description: 'Practice W-formation and rotational patterns. Emphasize communication and zone coverage.',
        duration: 25,
        difficulty: Difficulty.MEDIUM,
        sportId: volleyball.id,
        categoryId: tactical.id,
        creatorId: klaas.id,
        isPublic: true,
        techniques: ['pass', 'defense'],
        playerMin: 6,
        playerMax: 12,
        skillLevel: SkillLevel.INTERMEDIATE,
        tags: ['receive', 'formation', 'rotation'],
      },
      {
        title: '6-2 Offense System Practice',
        description: 'Run 6-2 offense with setter coming from back row. Focus on transition and offensive options.',
        duration: 35,
        difficulty: Difficulty.HARD,
        sportId: volleyball.id,
        categoryId: tactical.id,
        creatorId: klaas.id,
        isPublic: true,
        techniques: ['set', 'attack', 'pass'],
        playerMin: 12,
        playerMax: 18,
        skillLevel: SkillLevel.ADVANCED,
        tags: ['offense', 'system', '6-2'],
      },
      {
        title: 'Transition Attack Patterns',
        description: 'From defense to offense. Quick transitions with emphasis on communication and court awareness.',
        duration: 30,
        difficulty: Difficulty.HARD,
        sportId: volleyball.id,
        categoryId: tactical.id,
        creatorId: klaas.id,
        isPublic: true,
        techniques: ['attack', 'defense', 'pass'],
        playerMin: 6,
        playerMax: 12,
        skillLevel: SkillLevel.ADVANCED,
        tags: ['transition', 'offense', 'defense'],
      },
      
      // Physical exercises
      {
        title: 'Vertical Jump Training',
        description: 'Plyometric exercises including box jumps, approach jumps, and explosive movements.',
        duration: 20,
        difficulty: Difficulty.HARD,
        sportId: volleyball.id,
        categoryId: physical.id,
        creatorId: klaas.id,
        isPublic: true,
        techniques: [],
        playerMin: 1,
        playerMax: 20,
        skillLevel: SkillLevel.INTERMEDIATE,
        tags: ['jumping', 'power', 'plyometrics'],
        materials: { items: [{ name: 'Plyo boxes', quantity: 3 }, { name: 'Cones', quantity: 8 }] },
      },
      {
        title: 'Agility Ladder Drills',
        description: 'Footwork patterns through agility ladder. Various patterns for speed and coordination.',
        duration: 15,
        difficulty: Difficulty.MEDIUM,
        sportId: volleyball.id,
        categoryId: physical.id,
        creatorId: klaas.id,
        isPublic: true,
        techniques: [],
        playerMin: 1,
        playerMax: 20,
        skillLevel: SkillLevel.BEGINNER,
        tags: ['agility', 'footwork', 'speed'],
        materials: { items: [{ name: 'Agility ladders', quantity: 4 }] },
      },
      
      // Game play
      {
        title: 'Competitive 6v6 Scrimmage',
        description: 'Full court scrimmage with game situations. Focus on applying skills learned in practice.',
        duration: 40,
        difficulty: Difficulty.MEDIUM,
        sportId: volleyball.id,
        categoryId: gamePlay.id,
        creatorId: klaas.id,
        isPublic: true,
        techniques: ['attack', 'defense', 'pass', 'set', 'block', 'serve'],
        playerMin: 12,
        playerMax: 18,
        skillLevel: SkillLevel.INTERMEDIATE,
        tags: ['game', 'scrimmage', 'competition'],
      },
      {
        title: 'King/Queen of the Court',
        description: 'Competitive drill where teams must win to stay on winners side. Loser rotates out.',
        duration: 25,
        difficulty: Difficulty.MEDIUM,
        sportId: volleyball.id,
        categoryId: gamePlay.id,
        creatorId: klaas.id,
        isPublic: true,
        techniques: ['attack', 'defense', 'pass'],
        playerMin: 9,
        playerMax: 18,
        skillLevel: SkillLevel.INTERMEDIATE,
        tags: ['game', 'competition', 'fun'],
      },
      
      // Cool down
      {
        title: 'Static Stretching and Recovery',
        description: 'Full body static stretching routine. Hold each stretch for 30 seconds. Focus on major muscle groups.',
        duration: 10,
        difficulty: Difficulty.EASY,
        sportId: volleyball.id,
        categoryId: coolDown.id,
        creatorId: klaas.id,
        isPublic: true,
        techniques: [],
        playerMin: 1,
        playerMax: 20,
        skillLevel: SkillLevel.BEGINNER,
        tags: ['stretching', 'cool-down', 'recovery'],
      },
    ],
  })

  const allExercises = await prisma.exercise.findMany()
  console.log(`✅ Created ${allExercises.length} exercises`)

  console.log('\n🎉 Seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   • ${await prisma.user.count()} users`)
  console.log(`   • ${await prisma.team.count()} teams`)
  console.log(`   • ${await prisma.exercise.count()} exercises`)
  console.log('\n🔐 Login credentials:')
  console.log('   Admin: kltalsma@gmail.com / password123')
  console.log('   All players: <firstname>.<lastname>@opmheerenveen.nl / password123')
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
