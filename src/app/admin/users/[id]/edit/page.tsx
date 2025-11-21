import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UserDeleteButton } from "@/components/UserDeleteButton"
import { TeamRoleManager } from "@/components/TeamRoleManager"
import { AddUserToTeam } from "@/components/AddUserToTeam"

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function EditUserPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Check if user is ADMIN
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  if (currentUser?.role !== 'ADMIN') {
    redirect("/dashboard")
  }

  // Fetch the user to edit
  const user = await prisma.user.findUnique({
    where: { id: id },
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
    }
  })

  if (!user) {
    redirect("/admin/users")
  }

  // Fetch all available teams for the "Add to New Team" component
  const allTeams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      sport: { select: { name: true } }
    },
    orderBy: { name: 'asc' }
  })

  // Get unique team IDs the user is already a member of
  const existingTeamIds = [...new Set(user.teams.map(m => m.team.id))]

  const handleUpdateUser = async (formData: FormData) => {
    "use server"
    
    const role = formData.get("role") as string
    const name = formData.get("name") as string
    
    if (!role || !['ADMIN', 'TRAINER', 'PLAYER'].includes(role)) {
      throw new Error("Invalid role")
    }

    try {
      await prisma.user.update({
        where: { id: id },
        data: {
          role: role as any,
          name: name || null
        }
      })
      
      redirect("/admin/users?success=User updated successfully")
    } catch (error) {
      throw new Error("Failed to update user")
    }
  }

  const handleDeleteUser = async () => {
    "use server"
    
    // Prevent deleting self
    if (id === session.user.id) {
      throw new Error("Cannot delete your own account")
    }

    try {
      await prisma.user.delete({
        where: { id: id }
      })
      
      redirect("/admin/users?success=User deleted successfully")
    } catch (error) {
      throw new Error("Failed to delete user")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-red-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ✏️ Edit User
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage user information and permissions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/admin/users"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Back to Users
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">User Information</h2>
              
              <form action={handleUpdateUser} className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    defaultValue={user.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter display name"
                  />
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={user.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email addresses cannot be changed</p>
                </div>

                {/* Role */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    User Role
                  </label>
                  <select
                    name="role"
                    id="role"
                    defaultValue={user.role}
                    disabled={id === session.user.id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="PLAYER">👤 Player - Basic access to assigned teams</option>
                    <option value="TRAINER">🏃 Trainer - Can create and manage teams, exercises, and workouts</option>
                    <option value="ADMIN">👑 Admin - Full system administration access</option>
                  </select>
                  {id === session.user.id && (
                    <p className="text-xs text-gray-500 mt-1">You cannot change your own role</p>
                  )}
                </div>

                {/* Theme (Read-only info) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme Preference
                  </label>
                  <input
                    type="text"
                    value={user.theme || 'default'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Theme is managed by the user in their account settings</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update User
                  </button>
                  <a
                    href="/admin/users"
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors text-center"
                  >
                    Cancel
                  </a>
                </div>
              </form>
            </div>
          </div>

          {/* User Info & Stats */}
          <div className="space-y-6">
            {/* User Details */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-600">
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.name || 'No name set'}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">User ID:</span>
                    <span className="text-gray-900 font-mono">{user.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Joined:</span>
                    <span className="text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Last Updated:</span>
                    <span className="text-gray-900">
                      {new Date(user.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">🏆 Teams Created</span>
                  <span className="text-sm font-medium text-gray-900">{user._count.createdTeams}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">📋 Workouts Created</span>
                  <span className="text-sm font-medium text-gray-900">{user._count.createdWorkouts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">🏐 Exercises Created</span>
                  <span className="text-sm font-medium text-gray-900">{user._count.createdExercises}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">👥 Team Memberships</span>
                  <span className="text-sm font-medium text-gray-900">{user.teams.length}</span>
                </div>
              </div>
            </div>

            {/* Add to New Team */}
            <AddUserToTeam
              userEmail={user.email}
              userName={user.name}
              availableTeams={allTeams}
              existingTeamIds={existingTeamIds}
            />

            {/* Team Memberships - Manage existing roles */}
            <TeamRoleManager 
              userId={user.id} 
              userEmail={user.email}
              userName={user.name}
              memberships={user.teams} 
            />

            {/* Danger Zone */}
            {id !== session.user.id && (
              <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h3>
                <p className="text-sm text-red-600 mb-4">
                  This action cannot be undone. The user will be permanently deleted.
                </p>
                
                <UserDeleteButton 
                  userName={user.name || user.email}
                  deleteAction={handleDeleteUser}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}