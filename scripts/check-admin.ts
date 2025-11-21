import { prisma } from '../src/lib/prisma'

async function checkAndSetAdminRole() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    })

    console.log('📊 Current Users in Database:')
    console.log('================================')
    
    users.forEach((user, index) => {
      const roleEmoji = user.role === 'ADMIN' ? '👑' : user.role === 'TRAINER' ? '🏃' : '👤'
      console.log(`${index + 1}. ${roleEmoji} ${user.name || 'No name'} (${user.email}) - ${user.role}`)
    })

    if (users.length === 0) {
      console.log('❌ No users found in database')
      return
    }

    // Check if there's already an admin
    const admins = users.filter(u => u.role === 'ADMIN')
    console.log(`\n🛡️  Admin users found: ${admins.length}`)

    if (admins.length === 0) {
      // No admin found, let's make the first user an admin
      const firstUser = users[0]
      
      console.log(`\n⚠️  No admin users found. Setting first user as admin:`)
      console.log(`   User: ${firstUser.name || 'No name'} (${firstUser.email})`)
      
      await prisma.user.update({
        where: { id: firstUser.id },
        data: { role: 'ADMIN' }
      })
      
      console.log(`✅ Successfully updated ${firstUser.email} to ADMIN role`)
      console.log(`\n🔑 You can now access the admin dashboard at: http://localhost:3000/admin`)
    } else {
      console.log(`\n✅ Admin access available for:`)
      admins.forEach(admin => {
        console.log(`   👑 ${admin.name || 'No name'} (${admin.email})`)
      })
      console.log(`\n🔑 Admin dashboard available at: http://localhost:3000/admin`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndSetAdminRole()