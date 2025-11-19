'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface TeamMember {
  id: string
  role: string
  user: User
}

interface Attendance {
  id: string
  sessionId: string
  memberId: string
  status: string
  notes: string | null
  member: TeamMember
}

interface Team {
  id: string
  name: string
}

interface Exercise {
  id: string
  title: string
  description: string | null
  duration: number | null
  difficulty: string
}

interface WorkoutExercise {
  id: string
  order: number
  duration: number | null
  notes: string | null
  exercise: Exercise
}

interface Workout {
  id: string
  title: string
  description: string | null
  totalDuration: number | null
  exercises: WorkoutExercise[]
}

interface AttendanceSummary {
  total: number
  present: number
  absent: number
  late: number
  excused: number
  pending: number
}

interface TrainingSession {
  id: string
  teamId: string
  workoutId: string | null
  title: string
  description: string | null
  scheduledAt: string
  duration: number | null
  location: string | null
  status: string
  team: Team
  workout: Workout | null
  attendance: Attendance[]
  attendanceSummary: AttendanceSummary
}

export default function SessionDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string

  const [trainingSession, setTrainingSession] = useState<TrainingSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isCoach, setIsCoach] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (sessionId) {
      fetchSession()
    }
  }, [sessionId])

  const fetchSession = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/training-sessions/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setTrainingSession(data)
        
        // Check if current user is a coach
        if (session?.user?.email) {
          const userResponse = await fetch('/api/user')
          if (userResponse.ok) {
            const userData = await userResponse.json()
            const coachMember = data.attendance.find(
              (a: Attendance) => 
                a.member.user.id === userData.id && 
                ['COACH', 'ASSISTANT_COACH'].includes(a.member.role)
            )
            setIsCoach(!!coachMember)
          }
        }
      } else {
        setError('Failed to load training session')
      }
    } catch (error) {
      console.error('Error fetching session:', error)
      setError('Failed to load training session')
    } finally {
      setLoading(false)
    }
  }

  const updateAttendance = async (attendanceId: string, newStatus: string) => {
    if (!isCoach) return

    try {
      setSaving(true)
      const response = await fetch(`/api/attendance/${attendanceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        // Refresh session data
        await fetchSession()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update attendance')
      }
    } catch (error) {
      console.error('Error updating attendance:', error)
      setError('Failed to update attendance')
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'ABSENT':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'LATE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'EXCUSED':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'PENDING':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (error && !trainingSession) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  if (!trainingSession) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/sessions" className="text-blue-600 hover:underline mb-2 inline-block">
          ← Back to Sessions
        </Link>
        <h1 className="text-3xl font-bold">{trainingSession.title}</h1>
        <p className="text-gray-600">{trainingSession.team.name}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Session Details</h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Date & Time:</span>
                <p className="text-gray-900">{formatDate(trainingSession.scheduledAt)}</p>
              </div>
              {trainingSession.duration && (
                <div>
                  <span className="font-medium text-gray-700">Duration:</span>
                  <p className="text-gray-900">{trainingSession.duration} minutes</p>
                </div>
              )}
              {trainingSession.location && (
                <div>
                  <span className="font-medium text-gray-700">Location:</span>
                  <p className="text-gray-900">{trainingSession.location}</p>
                </div>
              )}
              {trainingSession.description && (
                <div>
                  <span className="font-medium text-gray-700">Description:</span>
                  <p className="text-gray-900">{trainingSession.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Workout Plan */}
          {trainingSession.workout && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Workout Plan</h2>
              <h3 className="font-medium text-lg mb-2">{trainingSession.workout.title}</h3>
              {trainingSession.workout.description && (
                <p className="text-gray-600 mb-4">{trainingSession.workout.description}</p>
              )}
              
              {trainingSession.workout.exercises.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Exercises:</h4>
                  {trainingSession.workout.exercises.map((we, index) => (
                    <div key={we.id} className="border-l-4 border-blue-500 pl-3 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-gray-900">
                            {index + 1}. {we.exercise.title}
                          </span>
                          {we.exercise.description && (
                            <p className="text-sm text-gray-600 mt-1">{we.exercise.description}</p>
                          )}
                        </div>
                        {we.duration && (
                          <span className="text-sm text-gray-500 ml-2">{we.duration} min</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Attendance Tracking */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Attendance</h2>
            
            {!isCoach && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 text-sm">
                Only coaches can mark attendance
              </div>
            )}

            <div className="space-y-2">
              {trainingSession.attendance.map(attendance => (
                <div 
                  key={attendance.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                      {(attendance.member.user.name || attendance.member.user.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {attendance.member.user.name || attendance.member.user.email}
                      </p>
                      <p className="text-xs text-gray-500">{attendance.member.role}</p>
                    </div>
                  </div>

                  {isCoach ? (
                    <div className="flex gap-1">
                      {['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'].map(statusOption => (
                        <button
                          key={statusOption}
                          onClick={() => updateAttendance(attendance.id, statusOption)}
                          disabled={saving}
                          className={`px-3 py-1 text-xs rounded-lg border transition ${
                            attendance.status === statusOption
                              ? getStatusColor(statusOption)
                              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {statusOption}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className={`px-3 py-1 text-xs rounded-lg border ${getStatusColor(attendance.status)}`}>
                      {attendance.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Attendance Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Attendance Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold">{trainingSession.attendanceSummary.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-600">Present:</span>
                <span className="font-semibold text-green-600">{trainingSession.attendanceSummary.present}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-yellow-600">Late:</span>
                <span className="font-semibold text-yellow-600">{trainingSession.attendanceSummary.late}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-600">Absent:</span>
                <span className="font-semibold text-red-600">{trainingSession.attendanceSummary.absent}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-600">Excused:</span>
                <span className="font-semibold text-blue-600">{trainingSession.attendanceSummary.excused}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending:</span>
                <span className="font-semibold text-gray-600">{trainingSession.attendanceSummary.pending}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Attendance Rate:</span>
                  <span className="font-bold text-lg">
                    {trainingSession.attendanceSummary.total > 0
                      ? Math.round(((trainingSession.attendanceSummary.present + trainingSession.attendanceSummary.late) / trainingSession.attendanceSummary.total) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {isCoach && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    trainingSession.attendance.forEach(a => {
                      if (a.status === 'PENDING') updateAttendance(a.id, 'PRESENT')
                    })
                  }}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                >
                  Mark All Present
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
