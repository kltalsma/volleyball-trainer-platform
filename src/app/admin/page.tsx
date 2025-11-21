import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function AdminDashboard() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Check if user is ADMIN
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  if (user?.role !== 'ADMIN') {
    redirect("/dashboard")
  }

  // Fetch admin statistics
  const [
    totalUsers,
    totalTrainers,
    totalPlayers,
    totalAdmins,
    totalTeams,
    totalExercises,
    totalWorkouts,
    recentUsers,
    topTeams,
    systemMetrics
  ] = await Promise.all([
    // User statistics
    prisma.user.count(),
    prisma.user.count({ where: { role: 'TRAINER' } }),
    prisma.user.count({ where: { role: 'PLAYER' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    
    // Platform statistics
    prisma.team.count(),
    prisma.exercise.count(),
    prisma.workout.count(),
    
    // Recent activity
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    }),
    
    // Top teams by members/activity
    prisma.team.findMany({
      include: {
        sport: { select: { name: true } },
        creator: { select: { name: true, email: true } },
        _count: {
          select: {
            members: true,
            workouts: true
          }
        }
      },
      orderBy: {
        members: { _count: 'desc' }
      },
      take: 5
    }),
    
    // System metrics
    Promise.all([
      prisma.exercise.count({ where: { isPublic: true } }),
      prisma.workout.count({ where: { isPublic: true } }),
      prisma.teamMember.count(),
    ]).then(([publicExercises, publicWorkouts, totalMemberships]) => ({
      publicExercises,
      publicWorkouts,
      totalMemberships
    }))
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-red-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🛡️ Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                System administration and user management
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Back to Dashboard
              </a>
              <a
                href="/account"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ⚙️ Account
              </a>
            </div>
          </div>
        </div>

        {/* Admin Navigation */}
        <nav className="bg-red-50 border-t border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8 py-3">
              <a
                href="/admin"
                className="px-3 py-2 text-sm font-medium text-red-600 border-b-2 border-red-600"
              >
                Overview
              </a>
              <a
                href="/admin/users"
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:border-b-2 hover:border-red-300 transition-colors"
              >
                👥 User Management
              </a>
              <a
                href="/admin/teams"
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:border-b-2 hover:border-red-300 transition-colors"
              >
                🏆 Team Management
              </a>
              <a
                href="/admin/system"
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:border-b-2 hover:border-red-300 transition-colors"
              >
                🔧 System Settings
              </a>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalUsers}</p>
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>👑 Admins:</span>
                    <span className="text-red-600 font-medium">{totalAdmins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🏃 Trainers:</span>
                    <span className="text-blue-600 font-medium">{totalTrainers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>👤 Players:</span>
                    <span className="text-green-600 font-medium">{totalPlayers}</span>
                  </div>
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Teams */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Teams</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalTeams}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {systemMetrics.totalMemberships} total memberships
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Exercises */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Exercises</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalExercises}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {systemMetrics.publicExercises} public exercises
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Workouts */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Training Plans</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalWorkouts}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {systemMetrics.publicWorkouts} public plans
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Admin Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a 
              href="/admin/users/new" 
              className="flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add User
            </a>
            <a 
              href="/admin/users" 
              className="flex items-center justify-center px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              Manage Users
            </a>
            <a 
              href="/admin/teams" 
              className="flex items-center justify-center px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Manage Teams
            </a>
            <a 
              href="/admin/system" 
              className="flex items-center justify-center px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              System Settings
            </a>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">👥 Recent Users</h2>
              <a href="/admin/users" className="text-sm text-blue-600 hover:text-blue-700">View all →</a>
            </div>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border hover:border-blue-300 transition-all">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {user.name || user.email}
                    </h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                      user.role === 'TRAINER' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'ADMIN' ? '👑' : user.role === 'TRAINER' ? '🏃' : '👤'} {user.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Teams */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">🏆 Active Teams</h2>
              <a href="/admin/teams" className="text-sm text-blue-600 hover:text-blue-700">View all →</a>
            </div>
            <div className="space-y-3">
              {topTeams.map((team) => (
                <div key={team.id} className="flex items-center justify-between p-3 rounded-lg border hover:border-blue-300 transition-all">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{team.name}</h3>
                    <p className="text-sm text-gray-600">{team.sport.name}</p>
                    <p className="text-xs text-gray-500">
                      Coach: {team.creator.name || team.creator.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      <div>👥 {team._count.members} members</div>
                      <div>📋 {team._count.workouts} trainings</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}