"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import TrainingCalendar from "@/components/TrainingCalendar"

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

interface ScheduledTraining {
  id: string
  teamId: string
  workoutId: string | null
  title: string
  description: string | null
  scheduledAt: string
  duration: number | null
  location: string | null
  status: string
  workout: {
    id: string
    title: string
  } | null
  attendanceSummary: {
    total: number
    present: number
    absent: number
    late: number
    excused: number
    pending: number
  }
}

interface Team {
  id: string
  name: string
  description: string | null
  volleybalNlApiId: string | null
  volleybalNlClubId: string | null
  volleybalNlCategory: string | null
  volleybalNlTeamNumber: number | null
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
  const [scheduledTrainings, setScheduledTrainings] = useState<ScheduledTraining[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showScheduleModal, setShowScheduleModal] = useState(false)

  useEffect(() => {
    fetchTeam()
    fetchScheduledTrainings()
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

  async function fetchScheduledTrainings() {
    try {
      const response = await fetch(`/api/training-sessions?teamId=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setScheduledTrainings(data)
      }
    } catch (error) {
      console.error("Error fetching scheduled trainings:", error)
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
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
                  {team.volleybalNlApiId && (
                    <a
                      href={`https://www.volleybal.nl${team.volleybalNlApiId.replace('/competitie/teams/', '/competitie/vereniging/')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full hover:bg-orange-200 transition"
                      title="View on Volleybal.nl"
                    >
                      <span>Volleybal.nl</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
                <p className="text-sm text-gray-500">{team.sport.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/teams/${params.id}/edit`}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Edit Team
              </Link>
              <Link
                href={`/trainings/new?teamId=${team.id}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                + Create Training
              </Link>
            </div>
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

        {/* Scheduled Trainings Section - New Calendar/List Component */}
        <TrainingCalendar 
          trainings={scheduledTrainings}
          teamId={params.id as string}
          onScheduleTraining={() => setShowScheduleModal(true)}
        />

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
                        member.role === 'TRAINER' ? 'bg-orange-100 text-orange-700' :
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

      {/* Schedule Training Modal */}
      {showScheduleModal && (
        <ScheduleTrainingModal
          teamId={params.id as string}
          teamName={team.name}
          trainingPlans={team.workouts}
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => {
            setShowScheduleModal(false)
            fetchScheduledTrainings()
          }}
        />
      )}
    </div>
  )
}

// Schedule Training Modal Component
function ScheduleTrainingModal({
  teamId,
  teamName,
  trainingPlans,
  onClose,
  onSuccess
}: {
  teamId: string
  teamName: string
  trainingPlans: Training[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    workoutId: "",
    title: "",
    description: "",
    scheduledAt: "",
    duration: "",
    location: ""
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    try {
      const response = await fetch("/api/training-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          workoutId: formData.workoutId || null,
          title: formData.title,
          description: formData.description || null,
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
          duration: formData.duration ? parseInt(formData.duration) : null,
          location: formData.location || null
        })
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to schedule training")
      }
    } catch (err) {
      console.error("Error scheduling training:", err)
      setError("An error occurred while scheduling the training")
    } finally {
      setSubmitting(false)
    }
  }

  function handleWorkoutChange(workoutId: string) {
    const workout = trainingPlans.find(w => w.id === workoutId)
    setFormData({
      ...formData,
      workoutId,
      title: workout?.title || formData.title,
      duration: workout?.totalDuration?.toString() || formData.duration
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Schedule Training</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Training Plan (Optional)
              </label>
              <select
                value={formData.workoutId}
                onChange={(e) => handleWorkoutChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Custom training (no plan)</option>
                {trainingPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.title} ({plan._count.exercises} exercises)
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select a training plan or create a custom training
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Monday Training, Match Preparation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any additional notes or instructions..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="90"
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Main Gym, Court 1"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Scheduling..." : "Schedule Training"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
