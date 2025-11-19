"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"

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
  _count: {
    exercises: number
  }
}

interface Member {
  id: string
  role: string
  number: number | null
  position: string | null
  joinedAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface Team {
  id: string
  name: string
  description: string | null
  sport: {
    id: string
    name: string
  }
  members: Member[]
  workouts: Training[]
  _count: {
    members: number
    workouts: number
    trainingSessions: number
  }
}

export default function TeamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchTeam()
  }, [params.id])

  async function fetchTeam() {
    setLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/teams/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setTeam(data)
      } else if (response.status === 403) {
        setError("You don't have access to this team")
      } else if (response.status === 404) {
        setError("Team not found")
      } else {
        setError("Failed to load team")
      }
    } catch (error) {
      console.error("Error fetching team:", error)
      setError("Failed to load team")
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-red-600 text-lg mb-4">{error || "Team not found"}</p>
            <Link
              href="/dashboard"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
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
                <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
                <p className="text-sm text-gray-500">{team.sport.name}</p>
              </div>
            </div>
            <Link
              href={`/trainings/new?teamId=${team.id}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              + Create Training
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Team Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
              <p className="text-gray-900">{team.description || "No description"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Members</h3>
              <p className="text-2xl font-bold text-gray-900">{team._count.members}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Training Plans</h3>
              <p className="text-2xl font-bold text-gray-900">{team._count.workouts}</p>
            </div>
          </div>
        </div>

        {/* Trainings Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Training Plans</h2>
            <Link
              href={`/trainings?teamId=${team.id}`}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              View all →
            </Link>
          </div>

          {team.workouts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No training plans yet</p>
              <Link
                href={`/trainings/new?teamId=${team.id}`}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Create first training plan
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {team.workouts.slice(0, 6).map((training) => (
                <Link
                  key={training.id}
                  href={`/trainings/${training.id}`}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {training.title}
                    </h3>
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

                  {training.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {training.description}
                    </p>
                  )}

                  {training.startTime && (
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <span className="mr-2">🕐</span>
                      <span>{formatDateTime(training.startTime)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-500">
                      🏋️ {training._count.exercises} exercises
                    </span>
                    <span className="text-xs text-gray-400">
                      by {training.creator.name || training.creator.email.split('@')[0]}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Members</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {team.members.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {member.user.name || member.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        member.role === 'COACH' ? 'bg-purple-100 text-purple-700' :
                        member.role === 'ASSISTANT_COACH' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {member.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.position || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(member.joinedAt), "PP")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
