"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import EmptyState from "@/components/EmptyState"

interface Training {
  id: string
  title: string
  description: string | null
  startTime: string | null
  endTime: string | null
  totalDuration: number | null
  isPublic: boolean
  createdAt: string
  creator: { id: string; name: string | null; email: string }
  team: { id: string; name: string } | null
  _count: {
    exercises: number
    trainingSessions: number
  }
}

interface Team {
  id: string
  name: string
}

export default function TrainingsPage() {
  const router = useRouter()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter state
  const [teamFilter, setTeamFilter] = useState("")
  const [viewFilter, setViewFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTrainings()
    }, 300)
    
    return () => clearTimeout(timer)
  }, [teamFilter, viewFilter, searchQuery])

  // Initial load
  useEffect(() => {
    fetchTeams()
  }, [])

  async function fetchTeams() {
    try {
      const response = await fetch("/api/teams")
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams || [])
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
    }
  }

  async function fetchTrainings() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (teamFilter) params.append("teamId", teamFilter)
      if (viewFilter === "my") params.append("myWorkouts", "true")
      if (viewFilter === "public") params.append("publicOnly", "true")
      if (searchQuery) params.append("search", searchQuery)
      
      const response = await fetch(`/api/workouts?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTrainings(data.workouts)
      }
    } catch (error) {
      console.error("Error fetching trainings:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Not scheduled"
    try {
      return format(new Date(dateString), "PPp")
    } catch {
      return "Invalid date"
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
                <h1 className="text-2xl font-bold text-gray-900">Trainings</h1>
                <p className="text-sm text-gray-500">Manage and schedule your training sessions</p>
              </div>
            </div>
            <Link
              href="/trainings/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              + Create Training
            </Link>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search trainings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Team Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team
              </label>
              <div className="relative">
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 cursor-pointer appearance-none"
                >
                  <option value="">All Teams</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* View Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View
              </label>
              <div className="relative">
                <select
                  value={viewFilter}
                  onChange={(e) => setViewFilter(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 cursor-pointer appearance-none"
                >
                  <option value="all">My Trainings & Team Trainings</option>
                  <option value="my">My Trainings Only</option>
                  <option value="public">Browse Public Library</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Results count */}
            <div className="flex items-end">
              <p className="text-sm text-gray-600">
                {loading ? "Loading..." : `${trainings.length} training${trainings.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
          </div>
        </div>

        {/* Training List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : trainings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12">
            <EmptyState
              icon="🏐"
              title={viewFilter === "public" ? "No public trainings found" : "No trainings found"}
              description={
                viewFilter === "public"
                  ? "There are no public trainings available yet. Create your own and make it public to share with others!"
                  : searchQuery
                  ? "No trainings match your search criteria. Try adjusting your filters."
                  : "Get started by creating your first training session. Add exercises, set duration, and schedule it for your team."
              }
              actionLabel={viewFilter === "public" ? "Create Public Training" : "Create Your First Training"}
              actionHref="/trainings/new"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainings.map((training) => (
              <Link
                key={training.id}
                href={`/trainings/${training.id}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 hover:border-blue-300"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {training.title}
                    </h3>
                    {training.team && (
                      <p className="text-sm text-blue-600 mb-2">
                        📋 {training.team.name}
                      </p>
                    )}
                  </div>
                  {training.isPublic ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Public
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      Private
                    </span>
                  )}
                </div>

                {/* Description */}
                {training.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {training.description}
                  </p>
                )}

                {/* Time Info */}
                <div className="space-y-2 mb-4">
                  {training.startTime && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">🕐</span>
                      <span>Start: {formatDateTime(training.startTime)}</span>
                    </div>
                  )}
                  {training.endTime && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">🕐</span>
                      <span>End: {formatDateTime(training.endTime)}</span>
                    </div>
                  )}
                  {training.totalDuration && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">⏱️</span>
                      <span>Duration: {training.totalDuration} min</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>🏋️ {training._count.exercises} exercises</span>
                    <span>📅 {training._count.trainingSessions} sessions</span>
                  </div>
                </div>

                {/* Creator */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    By {training.creator.name || training.creator.email}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
