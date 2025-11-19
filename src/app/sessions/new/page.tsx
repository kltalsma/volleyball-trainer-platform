'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Team {
  id: string
  name: string
}

interface Workout {
  id: string
  title: string
  totalDuration: number | null
}

export default function NewSessionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    teamId: '',
    workoutId: '',
    title: '',
    description: '',
    scheduledAt: '',
    duration: '',
    location: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    fetchTeams()
  }, [])

  useEffect(() => {
    if (formData.teamId) {
      fetchWorkouts(formData.teamId)
    }
  }, [formData.teamId])

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

  const fetchWorkouts = async (teamId: string) => {
    try {
      const response = await fetch(`/api/workouts?teamId=${teamId}`)
      if (response.ok) {
        const data = await response.json()
        setWorkouts(data)
      }
    } catch (error) {
      console.error('Error fetching workouts:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.teamId || !formData.title || !formData.scheduledAt) {
        setError('Please fill in all required fields')
        setLoading(false)
        return
      }

      const response = await fetch('/api/training-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamId: formData.teamId,
          workoutId: formData.workoutId || null,
          title: formData.title,
          description: formData.description || null,
          scheduledAt: formData.scheduledAt,
          duration: formData.duration ? parseInt(formData.duration) : null,
          location: formData.location || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create session')
      }

      const newSession = await response.json()
      router.push(`/sessions/${newSession.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create training session')
      setLoading(false)
    }
  }

  const handleWorkoutChange = (workoutId: string) => {
    setFormData(prev => ({ ...prev, workoutId }))
    
    // Auto-fill title and duration from selected workout
    if (workoutId) {
      const workout = workouts.find(w => w.id === workoutId)
      if (workout) {
        setFormData(prev => ({
          ...prev,
          title: prev.title || workout.title,
          duration: prev.duration || (workout.totalDuration?.toString() || '')
        }))
      }
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Schedule Training Session</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        {/* Team Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Team <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={formData.teamId}
              onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 cursor-pointer appearance-none pr-10"
              required
            >
              <option value="">Select a team</option>
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

        {/* Workout Selection (Optional) */}
        {formData.teamId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Based on Workout (optional)
            </label>
            <div className="relative">
              <select
                value={formData.workoutId}
                onChange={(e) => handleWorkoutChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 cursor-pointer appearance-none pr-10"
              >
                <option value="">None - Custom Session</option>
                {workouts.map(workout => (
                  <option key={workout.id} value={workout.id}>
                    {workout.title}
                    {workout.totalDuration ? ` (${workout.totalDuration} min)` : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            placeholder="e.g., Evening Training"
            required
          />
        </div>

        {/* Scheduled Date/Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date & Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={formData.scheduledAt}
            onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (minutes)
          </label>
          <input
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            placeholder="90"
            min="1"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            placeholder="e.g., Main Gym"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            rows={3}
            placeholder="Additional notes or instructions..."
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Session'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
