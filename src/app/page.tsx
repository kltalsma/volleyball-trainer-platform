import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🏐</span>
            <h1 className="text-2xl font-bold text-gray-900">Volleyball Trainer Platform</h1>
          </div>
          <nav className="flex gap-4">
            <Link href="/login" className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
              Login
            </Link>
            <Link href="/register" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 flex justify-center gap-4 text-5xl">
            <span>🏐</span>
            <span>🏐</span>
            <span>🏐</span>
          </div>
          
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Modern Training Management
            <br />
            <span className="text-blue-600">Designed for Volleyball Coaches</span>
          </h2>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Create volleyball exercises with court diagrams, plan training sessions, and manage your team.
            Built for speed and simplicity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/register" className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl text-center">
              Get Started Free
            </Link>
            <Link href="/login" className="px-8 py-4 bg-white text-gray-900 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors border-2 border-gray-200 text-center">
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-20">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Volleyball Exercise Library</h3>
            <p className="text-gray-600">
              Create and search volleyball exercises with visual court diagrams, player positions, and movement patterns.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Training Planner</h3>
            <p className="text-gray-600">
              Build complete training sessions by combining exercises with drag-and-drop.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Team Management</h3>
            <p className="text-gray-600">
              Manage rosters, schedule sessions, and track attendance all in one place.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
            <p className="text-gray-600">
              Built with modern technology for instant page loads and smooth interactions.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Mobile Ready</h3>
            <p className="text-gray-600">
              Access your training plans on any device - desktop, tablet, or phone.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Court Drawing Tool</h3>
            <p className="text-gray-600">
              Visualize volleyball drills with an intuitive drawing tool featuring a 2D court view from above.
            </p>
          </div>
        </div>

        {/* Status Section */}
        <div className="max-w-2xl mx-auto mt-20 bg-blue-50 border border-blue-200 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            🚀 Development Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-green-600 font-semibold">✓</span>
              <span className="text-gray-700">Database architecture complete</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-600 font-semibold">✓</span>
              <span className="text-gray-700">Docker infrastructure ready</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-600 font-semibold">✓</span>
              <span className="text-gray-700">Authentication system complete</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 font-semibold">○</span>
              <span className="text-gray-500">Exercise management in progress</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>Built with Next.js, React, TypeScript, Tailwind CSS, PostgreSQL, and Redis</p>
          <p className="mt-2 text-sm">A modern alternative to YourSportPlanner</p>
        </div>
      </footer>
    </div>
  );
}
