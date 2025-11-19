"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Team {
  id: string
  name: string
  description: string | null
  sport: {
    id: string
    name: string
  }
  members: Array<{
    user: {
      id: string
      name: string | null
      email: string
    }
  }>
  _count: {
    members: number
    workouts: number
  }
}

export default function TeamsPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [viewFilter, setViewFilter] = useState("my")

  useEffect(() => {
    fetchTeams()
  }, [viewFilter])

  async function fetchTeams() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (viewFilter === "my") params.append("myTeams", "true")
      
      const response = await fetch(`/api/teams?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams || [])
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                ← Back to Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
                <p className="text-sm text-gray-500">Manage your teams</p>
              </div>
            </div>
            <Link
              href="/teams/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              + Create Team
            </Link>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-4 items-center">
              <label htmlFor="view-filter" className="text-sm font-medium text-gray-700">
                View:
              </label>
              <div className="relative">
                <select
                  id="view-filter"
                  value={viewFilter}
                  onChange={(e) => setViewFilter(e.target.value)}
                  className="px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 cursor-pointer appearance-none"
                >
                  <option value="my">My Teams</option>
                  <option value="all">All Teams</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {loading ? "Loading..." : `${teams.length} team${teams.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
        </div>

        {/* Team List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : teams.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No teams found</p>
            <Link
              href="/teams/new"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Create your first team
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/teams/${team.id}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 hover:border-blue-300"
              >
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {team.name}
                  </h3>
                  <p className="text-sm text-blue-600">
                    🏐 {team.sport.name}
                  </p>
                </div>

                {/* Description */}
                {team.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {team.description}
                  </p>
                )}

                {/* Stats */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                    <span>👥 {team._count.members} members</span>
                    <span>📋 {team._count.workouts} trainings</span>
                  </div>
                  {team.members?.[0] && (
                    <p className="text-xs text-gray-500">
                      <span className="text-gray-400">Coach:</span>{' '}
                      {team.members[0].user.name || team.members[0].user.email}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
