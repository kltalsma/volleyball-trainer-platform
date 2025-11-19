'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Team {
  id: string
  name: string
}

interface Workout {
  id: string
  title: string
  totalDuration: number | null
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
  attendanceSummary: AttendanceSummary
}

export default function SessionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterTeam, setFilterTeam] = useState<string>('all')
  const [teams, setTeams] = useState<Team[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    fetchSessions()
    fetchTeams()
  }, [filterStatus, filterTeam])

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams')
      if (response.ok) {
        const data = await response.json()
        setTeams(data)
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filterStatus !== 'all') {
        params.append('status', filterStatus.toUpperCase())
      }
      
      if (filterTeam !== 'all') {
        params.append('teamId', filterTeam)
      }

      const response = await fetch(`/api/training-sessions?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('nl-NL', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getAttendancePercentage = (summary: AttendanceSummary) => {
    if (summary.total === 0) return 0
    return Math.round(((summary.present + summary.late) / summary.total) * 100)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Training Sessions</h1>
        <Link
          href="/sessions/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Schedule Session
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status:
            </label>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 cursor-pointer appearance-none pr-10"
              >
                <option value="all">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team:
            </label>
            <div className="relative">
              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 cursor-pointer appearance-none pr-10"
              >
                <option value="all">All Teams</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">No training sessions found</p>
          <Link
            href="/sessions/new"
            className="text-blue-600 hover:underline"
          >
            Schedule your first session
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map(session => (
            <Link
              key={session.id}
              href={`/sessions/${session.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-md transition p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1">{session.title}</h3>
                  <p className="text-gray-600 text-sm">{session.team.name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                  {session.status.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Date:</span> {formatDate(session.scheduledAt)}
                </div>
                {session.location && (
                  <div>
                    <span className="font-medium">Location:</span> {session.location}
                  </div>
                )}
                {session.workout && (
                  <div>
                    <span className="font-medium">Workout:</span> {session.workout.title}
                  </div>
                )}
              </div>

              {/* Attendance Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Attendance:</span>{' '}
                    {session.attendanceSummary.present} / {session.attendanceSummary.total} present
                    {' '}({getAttendancePercentage(session.attendanceSummary)}%)
                  </div>
                  <div className="flex gap-2 text-xs">
                    {session.attendanceSummary.late > 0 && (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        {session.attendanceSummary.late} late
                      </span>
                    )}
                    {session.attendanceSummary.absent > 0 && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                        {session.attendanceSummary.absent} absent
                      </span>
                    )}
                    {session.attendanceSummary.pending > 0 && (
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        {session.attendanceSummary.pending} pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
