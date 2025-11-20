"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"

interface Attendance {
  id: string
  status: string
  notes: string | null
  member: {
    id: string
    role: string
    number: number | null
    position: string | null
    user: {
      id: string
      name: string | null
      email: string
    }
  }
}

interface SessionExercise {
  id: string
  order: number
  duration: number | null
  notes: string | null
  exercise: {
    id: string
    title: string
    description: string | null
    difficulty: string
    duration: number | null
    diagram: string | null
    videoUrl: string | null
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
  team: {
    id: string
    name: string
  }
  workout: {
    id: string
    title: string
    totalDuration: number | null
  } | null
  attendance: Attendance[]
  exercises?: SessionExercise[]
}

export default function ScheduledTrainingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [training, setTraining] = useState<ScheduledTraining | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchTraining()
  }, [params.trainingId])

  async function fetchTraining() {
    setLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/training-sessions/${params.trainingId}`)
      if (response.ok) {
        const data = await response.json()
        setTraining(data)
      } else if (response.status === 403) {
        setError("You don't have access to this training")
      } else if (response.status === 404) {
        setError("Training not found")
      } else {
        setError("Failed to load training")
      }
    } catch (error) {
      console.error("Error fetching training:", error)
      setError("Failed to load training")
    } finally {
      setLoading(false)
    }
  }

  async function updateAttendance(attendanceId: string, status: string) {
    setUpdating(attendanceId)
    try {
      const response = await fetch(`/api/attendance/${attendanceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        // Refresh training data
        fetchTraining()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to update attendance")
      }
    } catch (error) {
      console.error("Error updating attendance:", error)
      alert("Failed to update attendance")
    } finally {
      setUpdating(null)
    }
  }

  async function markAllPresent() {
    if (!confirm("Mark all members as present?")) return

    try {
      const pendingAttendance = training?.attendance.filter(a => a.status === "PENDING") || []
      
      for (const attendance of pendingAttendance) {
        await fetch(`/api/attendance/${attendance.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "PRESENT" })
        })
      }

      fetchTraining()
    } catch (error) {
      console.error("Error marking all present:", error)
      alert("Failed to mark all as present")
    }
  }

  async function updateTrainingStatus(newStatus: string) {
    if (!confirm(`Mark this training as ${newStatus.toLowerCase()}?`)) return

    try {
      const response = await fetch(`/api/training-sessions/${params.trainingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchTraining()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to update training status")
      }
    } catch (error) {
      console.error("Error updating training status:", error)
      alert("Failed to update training status")
    }
  }

  const getAttendanceSummary = () => {
    if (!training) return { total: 0, present: 0, absent: 0, late: 0, excused: 0, pending: 0 }
    
    return {
      total: training.attendance.length,
      present: training.attendance.filter(a => a.status === "PRESENT").length,
      absent: training.attendance.filter(a => a.status === "ABSENT").length,
      late: training.attendance.filter(a => a.status === "LATE").length,
      excused: training.attendance.filter(a => a.status === "EXCUSED").length,
      pending: training.attendance.filter(a => a.status === "PENDING").length,
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-100 text-green-700 border-green-200"
      case "ABSENT":
        return "bg-red-100 text-red-700 border-red-200"
      case "LATE":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "EXCUSED":
        return "bg-blue-100 text-blue-700 border-blue-200"
      default:
        return "bg-gray-100 text-gray-600 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !training) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-red-600 text-lg mb-4">{error || "Training not found"}</p>
            <Link
              href={`/teams/${params.id}`}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Back to Team
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const summary = getAttendanceSummary()
  const isPast = new Date(training.scheduledAt) < new Date()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/teams/${params.id}`} className="text-gray-600 hover:text-gray-900">
                ← Back to {training.team.name}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              {training.status === "SCHEDULED" && isPast && (
                <button
                  onClick={() => updateTrainingStatus("COMPLETED")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Mark as Completed
                </button>
              )}
              {training.status === "SCHEDULED" && (
                <button
                  onClick={() => updateTrainingStatus("CANCELLED")}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Cancel Training
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Training Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{training.title}</h1>
                  <p className="text-lg text-gray-600">
                    {format(new Date(training.scheduledAt), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  training.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                  training.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {training.status}
                </span>
              </div>

              {training.description && (
                <p className="text-gray-700 mb-4">{training.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                {training.location && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Location</p>
                    <p className="text-sm font-medium text-gray-900">📍 {training.location}</p>
                  </div>
                )}
                {training.duration && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Duration</p>
                    <p className="text-sm font-medium text-gray-900">⏱️ {training.duration} min</p>
                  </div>
                )}
                {training.workout && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Training Plan</p>
                    <Link
                      href={`/trainings/${training.workout.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {training.workout.title} →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Exercises */}
            {training.exercises && training.exercises.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Training Plan</h2>
                <div className="space-y-3">
                  {training.exercises.map((sessionExercise, index) => (
                    <Link
                      key={sessionExercise.id}
                      href={`/exercises/${sessionExercise.exercise.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h3 className="font-medium text-gray-900">{sessionExercise.exercise.title}</h3>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {sessionExercise.duration && (
                                <span className="text-sm text-gray-600">
                                  ⏱️ {sessionExercise.duration} min
                                </span>
                              )}
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                sessionExercise.exercise.difficulty === "EASY" ? "bg-green-100 text-green-700" :
                                sessionExercise.exercise.difficulty === "HARD" ? "bg-red-100 text-red-700" :
                                "bg-yellow-100 text-yellow-700"
                              }`}>
                                {sessionExercise.exercise.difficulty}
                              </span>
                            </div>
                          </div>
                          {sessionExercise.exercise.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {sessionExercise.exercise.description}
                            </p>
                          )}
                          {sessionExercise.notes && (
                            <p className="text-sm text-blue-600 bg-blue-50 rounded px-2 py-1 mt-2">
                              💡 {sessionExercise.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t text-sm text-gray-500 text-center">
                  Total Duration: {training.exercises.reduce((sum, ex) => sum + (ex.duration || 0), 0)} minutes
                </div>
              </div>
            )}

            {/* Attendance List */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Attendance</h2>
                {summary.pending > 0 && (
                  <button
                    onClick={markAllPresent}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                  >
                    Mark All Present
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {training.attendance.map((attendance) => (
                  <div
                    key={attendance.id}
                    className={`p-4 rounded-lg border ${getStatusColor(attendance.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {attendance.member.user.name || attendance.member.user.email}
                          </p>
                          {attendance.member.number && (
                            <span className="px-2 py-0.5 bg-white bg-opacity-50 text-xs rounded">
                              #{attendance.member.number}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                          <span>{attendance.member.role.replace("_", " ")}</span>
                          {attendance.member.position && (
                            <>
                              <span>•</span>
                              <span>{attendance.member.position}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {training.status !== "CANCELLED" && (
                        <div className="flex gap-2">
                          {["PRESENT", "ABSENT", "LATE", "EXCUSED"].map((status) => (
                            <button
                              key={status}
                              onClick={() => updateAttendance(attendance.id, status)}
                              disabled={updating === attendance.id || attendance.status === status}
                              className={`px-3 py-1 text-xs font-medium rounded transition ${
                                attendance.status === status
                                  ? "bg-gray-900 text-white cursor-default"
                                  : "bg-white bg-opacity-50 hover:bg-opacity-100"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Members</span>
                  <span className="text-lg font-bold text-gray-900">{summary.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600">✓ Present</span>
                  <span className="text-lg font-bold text-green-600">{summary.present}</span>
                </div>
                {summary.late > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-yellow-600">⏰ Late</span>
                    <span className="text-lg font-bold text-yellow-600">{summary.late}</span>
                  </div>
                )}
                {summary.excused > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-600">📝 Excused</span>
                    <span className="text-lg font-bold text-blue-600">{summary.excused}</span>
                  </div>
                )}
                {summary.absent > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-red-600">✗ Absent</span>
                    <span className="text-lg font-bold text-red-600">{summary.absent}</span>
                  </div>
                )}
                {summary.pending > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">⏱ Pending</span>
                    <span className="text-lg font-bold text-gray-600">{summary.pending}</span>
                  </div>
                )}
              </div>

              {summary.total > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Attendance Rate</span>
                    <span className="text-xs font-medium text-gray-900">
                      {Math.round((summary.present / summary.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${(summary.present / summary.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
