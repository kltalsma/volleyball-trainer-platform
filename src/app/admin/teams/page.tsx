import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function AdminTeamsPage() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-red-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🏆 Team Management
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage teams and their configurations
              </p>
            </div>
            <div className="flex items-center gap-3">
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
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:border-b-2 hover:border-red-300 transition-colors"
              >
                👥 User Management
              </a>
              <a
                href="/admin/teams"
                className="px-3 py-2 text-sm font-medium text-red-600 border-b-2 border-red-600"
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
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-12 w-12 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.586V5L8 4z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Team Management Coming Soon</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Advanced team management features are being developed. For now, teams can be managed through the regular teams interface.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/teams"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Teams
            </a>
            <a
              href="/admin"
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Admin
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}