import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AdminUserFilters } from "@/components/AdminUserFilters"

interface SearchParams {
  role?: string
  search?: string
  teamId?: string
}

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
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

  // Build filter conditions
  const whereConditions: any = {}
  
  if (params.role && ['ADMIN', 'TRAINER', 'PLAYER'].includes(params.role)) {
    whereConditions.role = params.role
  }

  if (params.search) {
    whereConditions.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } }
    ]
  }

  if (params.teamId) {
    whereConditions.teams = {
      some: {
        teamId: params.teamId
      }
    }
  }

  // Fetch all users with their team memberships
  const users = await prisma.user.findMany({
    where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
    include: {
      teams: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              sport: { select: { name: true } }
            }
          }
        }
      },
      _count: {
        select: {
          createdTeams: true,
          createdExercises: true,
          createdWorkouts: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Fetch all teams for the filter dropdown
  const teams = await prisma.team.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: { name: 'asc' }
  })

  const userStats = {
    total: users.length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    trainers: users.filter(u => u.role === 'TRAINER').length,
    players: users.filter(u => u.role === 'PLAYER').length,
  }

  // Helper function to group team memberships by team
  const groupTeamsByTeamId = (teams: any[]) => {
    const grouped = new Map<string, { team: any; roles: string[] }>()
    
    teams.forEach((membership) => {
      const teamId = membership.team.id
      if (!grouped.has(teamId)) {
        grouped.set(teamId, {
          team: membership.team,
          roles: []
        })
      }
      grouped.get(teamId)!.roles.push(membership.role)
    })
    
    return Array.from(grouped.values())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-red-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                👥 User Management
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage users, roles, and permissions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/admin/users/new"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add User
              </a>
              <a
                href="/admin"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Back to Admin
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
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:border-b-2 hover:border-red-300 transition-colors"
              >
                Overview
              </a>
              <a
                href="/admin/users"
                className="px-3 py-2 text-sm font-medium text-red-600 border-b-2 border-red-600"
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
        {/* User Filters */}
        <AdminUserFilters teams={teams} />

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="text-center">
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">{userStats.total}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="text-center">
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-lg">👑</span>
              </div>
              <p className="text-3xl font-bold text-red-600">{userStats.admins}</p>
              <p className="text-sm text-gray-600">Admins</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="text-center">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-lg">🏃</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">{userStats.trainers}</p>
              <p className="text-sm text-gray-600">Trainers</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="text-center">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-lg">👤</span>
              </div>
              <p className="text-3xl font-bold text-green-600">{userStats.players}</p>
              <p className="text-sm text-gray-600">Players</p>
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teams
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {(user.name || user.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || 'No name set'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        user.role === 'TRAINER' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role === 'ADMIN' ? '👑' : user.role === 'TRAINER' ? '🏃' : '👤'} {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.teams.length > 0 ? (
                          <div className="space-y-1">
                            {(() => {
                              // Group memberships by team
                              const teamMap = new Map<string, { team: any; roles: string[] }>()
                              user.teams.forEach((membership) => {
                                const teamId = membership.team.id
                                if (!teamMap.has(teamId)) {
                                  teamMap.set(teamId, { team: membership.team, roles: [] })
                                }
                                teamMap.get(teamId)!.roles.push(membership.role)
                              })
                              
                              const groupedTeams = Array.from(teamMap.values())
                              
                              return groupedTeams.slice(0, 2).map((group, idx) => (
                                <div key={`${group.team.id}-${idx}`} className="text-xs">
                                  <span className="font-medium">{group.team.name}</span>
                                  <span className="text-gray-500"> ({group.team.sport.name})</span>
                                  <span className="ml-2 text-gray-600">
                                    ({group.roles.map(role => role.replace('_', ' ')).join(', ')})
                                  </span>
                                </div>
                              ))
                            })()}
                            {(() => {
                              // Count unique teams for "more" indicator
                              const uniqueTeams = new Set(user.teams.map(m => m.team.id))
                              return uniqueTeams.size > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{uniqueTeams.size - 2} more
                                </div>
                              )
                            })()}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">No teams</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 space-y-1">
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>🏆 {user._count.createdTeams} teams</span>
                          <span>📋 {user._count.createdWorkouts} workouts</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          🏐 {user._count.createdExercises} exercises
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <a
                          href={`/admin/users/${user.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          Edit
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {users.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding the first user to the system.</p>
              <div className="mt-6">
                <a
                  href="/admin/users/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add User
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}