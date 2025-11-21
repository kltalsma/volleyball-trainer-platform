import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export default async function NewUserPage() {
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

  const handleCreateUser = async (formData: FormData) => {
    "use server"
    
    const email = formData.get("email") as string
    const name = formData.get("name") as string
    const password = formData.get("password") as string
    const role = formData.get("role") as string
    
    // Validation
    if (!email || !password || !role) {
      throw new Error("Email, password, and role are required")
    }
    
    if (!['ADMIN', 'TRAINER', 'PLAYER'].includes(role)) {
      throw new Error("Invalid role")
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      throw new Error("A user with this email already exists")
    }

    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Create user
      await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: name || null,
          password: hashedPassword,
          role: role as any
        }
      })
      
      redirect("/admin/users?success=User created successfully")
    } catch (error) {
      console.error("Error creating user:", error)
      throw new Error("Failed to create user")
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
                ➕ Add New User
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Create a new user account with role assignment
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New User</h2>
              
              <form action={handleCreateUser} className="space-y-6">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="user@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be a valid email address</p>
                </div>

                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional - user can update this later</p>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                </div>

                {/* Role */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    User Role *
                  </label>
                  <select
                    name="role"
                    id="role"
                    required
                    defaultValue="PLAYER"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="PLAYER">👤 Player - Basic access to assigned teams</option>
                    <option value="TRAINER">🏃 Trainer - Can create and manage teams, exercises, and workouts</option>
                    <option value="ADMIN">👑 Admin - Full system administration access</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Role can be changed later if needed</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create User
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

          {/* Help & Guidelines */}
          <div className="space-y-6">
            {/* Role Guide */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎭 Role Guide</h3>
              
              <div className="space-y-4">
                <div className="border-l-4 border-green-400 pl-4">
                  <h4 className="font-medium text-green-800">👤 Player</h4>
                  <p className="text-sm text-green-600">
                    Basic access to view assigned teams and participate in training sessions.
                  </p>
                </div>

                <div className="border-l-4 border-blue-400 pl-4">
                  <h4 className="font-medium text-blue-800">🏃 Trainer</h4>
                  <p className="text-sm text-blue-600">
                    Can create teams, design exercises, plan workouts, and manage training sessions.
                  </p>
                </div>

                <div className="border-l-4 border-red-400 pl-4">
                  <h4 className="font-medium text-red-800">👑 Admin</h4>
                  <p className="text-sm text-red-600">
                    Full system access including user management, system settings, and platform administration.
                  </p>
                </div>
              </div>
            </div>

            {/* Security Guidelines */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔒 Security Guidelines</h3>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Use strong passwords (minimum 6 characters)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Start with PLAYER role and upgrade as needed</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Only grant ADMIN role to trusted users</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Users can change their own passwords in account settings</span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 After Creating User</h3>
              
              <div className="space-y-2 text-sm text-blue-700">
                <p>• Share login credentials securely</p>
                <p>• Add user to appropriate teams</p>
                <p>• Guide user to complete profile setup</p>
                <p>• Monitor user activity and adjust role if needed</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}