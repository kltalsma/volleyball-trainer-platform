"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
  category: { id: string; name: string } | null
}

interface WorkoutExercise {
  id: string
  exerciseId: string
  order: number
  duration: number | null
  notes: string | null
  exercise: Exercise
}

interface Training {
  id: string
  title: string
  description: string | null
  startTime: string | null
  endTime: string | null
  totalDuration: number | null
  isPublic: boolean
  teamId: string | null
  exercises: WorkoutExercise[]
}

export default function EditTrainingPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  const [training, setTraining] = useState<Training | null>(null)
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [showExercisePicker, setShowExercisePicker] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    teamId: "",
    isPublic: false,
    startTime: "",
    endTime: "",
    totalDuration: ""
  })

  useEffect(() => {
    fetchTraining()
    fetchTeams()
    fetchAvailableExercises()
  }, [unwrappedParams.id])

  async function fetchTraining() {
    try {
      const response = await fetch(`/api/workouts/${unwrappedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setTraining(data)
        setWorkoutExercises(data.exercises || [])
        
        // Populate form
        setFormData({
          title: data.title || "",
          description: data.description || "",
          teamId: data.teamId || "",
          isPublic: data.isPublic || false,
          startTime: data.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : "",
          endTime: data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : "",
          totalDuration: data.totalDuration?.toString() || ""
        })
      } else {
        setError("Failed to load training")
      }
    } catch (err) {
      console.error("Error fetching training:", err)
      setError("An error occurred while loading the training")
    } finally {
      setLoading(false)
    }
  }

  async function fetchTeams() {
    try {
      const response = await fetch("/api/teams?myTeams=true")
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams || [])
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
    }
  }

  async function fetchAvailableExercises() {
    try {
      const response = await fetch("/api/exercises?limit=100")
      if (response.ok) {
        const data = await response.json()
        setAvailableExercises(data.exercises || [])
      }
    } catch (error) {
      console.error("Error fetching exercises:", error)
    }
  }

  const addExercise = async (exercise: Exercise) => {
    try {
      const response = await fetch("/api/workout-exercises", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workoutId: unwrappedParams.id,
          exerciseId: exercise.id,
          order: workoutExercises.length + 1,
          duration: exercise.duration || 10,
          notes: ""
        }),
      })

      if (response.ok) {
        const newExercise = await response.json()
        setWorkoutExercises([...workoutExercises, newExercise])
        setShowExercisePicker(false)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to add exercise")
      }
    } catch (err) {
      console.error("Error adding exercise:", err)
      setError("An error occurred while adding the exercise")
    }
  }

  const removeExercise = async (exerciseId: string, index: number) => {
    try {
      const response = await fetch(`/api/workout-exercises/${exerciseId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        const updated = workoutExercises.filter((_, i) => i !== index)
        // Reorder locally
        updated.forEach((ex, i) => {
          ex.order = i + 1
        })
        setWorkoutExercises(updated)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to remove exercise")
      }
    } catch (err) {
      console.error("Error removing exercise:", err)
      setError("An error occurred while removing the exercise")
    }
  }

  const moveExercise = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= workoutExercises.length) return

    const updated = [...workoutExercises]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp

    // Update orders
    updated.forEach((ex, i) => {
      ex.order = i + 1
    })
    setWorkoutExercises(updated)

    // Update on server
    try {
      await Promise.all([
        fetch(`/api/workout-exercises/${updated[index].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: updated[index].order })
        }),
        fetch(`/api/workout-exercises/${updated[newIndex].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: updated[newIndex].order })
        })
      ])
    } catch (err) {
      console.error("Error updating order:", err)
    }
  }

  const updateExerciseDuration = async (id: string, index: number, duration: number) => {
    const updated = [...workoutExercises]
    updated[index].duration = duration
    setWorkoutExercises(updated)

    try {
      await fetch(`/api/workout-exercises/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration })
      })
    } catch (err) {
      console.error("Error updating duration:", err)
    }
  }

  const updateExerciseNotes = async (id: string, index: number, notes: string) => {
    const updated = [...workoutExercises]
    updated[index].notes = notes
    setWorkoutExercises(updated)

    try {
      await fetch(`/api/workout-exercises/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes })
      })
    } catch (err) {
      console.error("Error updating notes:", err)
    }
  }

  // Calculate total duration from selected exercises
  const calculatedDuration = workoutExercises.reduce((sum, ex) => sum + (ex.duration || 0), 0)
  
  // Calculate remaining time if totalDuration is set
  const totalDurationValue = formData.totalDuration ? parseInt(formData.totalDuration) : 0
  const remainingTime = totalDurationValue > 0 ? totalDurationValue - calculatedDuration : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.title) {
      setError("Title is required")
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/workouts/${unwrappedParams.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          teamId: formData.teamId || undefined,
          isPublic: formData.isPublic,
          startTime: formData.startTime || undefined,
          endTime: formData.endTime || undefined,
          totalDuration: formData.totalDuration ? parseInt(formData.totalDuration) : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to update training")
        setSaving(false)
        return
      }

      router.push(`/trainings/${unwrappedParams.id}`)
      router.refresh()
    } catch (err) {
      console.error("Error updating training:", err)
      setError("An unexpected error occurred")
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading training...</p>
        </div>
      </div>
    )
  }

  if (error && !training) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/trainings" className="text-gray-600 hover:text-gray-900">
              ← Back to Trainings
            </Link>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/trainings/${unwrappedParams.id}`} className="text-gray-600 hover:text-gray-900">
              ← Back to Training
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Edit Training</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Training Title *
              </label>
              <input
                id="title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                placeholder="e.g., Advanced Serving Practice"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                placeholder="Training goals and focus areas..."
              />
            </div>

            {/* Team */}
            <div>
              <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-2">
                Team
              </label>
              <select
                id="team"
                value={formData.teamId}
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              >
                <option value="">No team (personal)</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="totalDuration" className="block text-sm font-medium text-gray-700 mb-2">
                  Total Duration (min)
                </label>
                <input
                  id="totalDuration"
                  type="number"
                  min="1"
                  value={formData.totalDuration}
                  onChange={(e) => setFormData({ ...formData, totalDuration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  placeholder="90"
                />
              </div>
            </div>

            {/* Public checkbox */}
            <div className="flex items-center">
              <input
                id="isPublic"
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                Make this training public (visible to all users)
              </label>
            </div>
          </div>

          {/* Exercises */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Exercises</h2>
              <button
                type="button"
                onClick={() => setShowExercisePicker(!showExercisePicker)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                + Add Exercise
              </button>
            </div>

            {/* Duration Summary */}
            {workoutExercises.length > 0 && (
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Exercises Duration</p>
                      <p className="text-2xl font-bold text-gray-900">{calculatedDuration} min</p>
                    </div>
                    
                    {totalDurationValue > 0 && (
                      <>
                        <div className="h-12 w-px bg-gray-300"></div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Total Training Duration</p>
                          <p className="text-2xl font-bold text-gray-900">{totalDurationValue} min</p>
                        </div>
                        
                        <div className="h-12 w-px bg-gray-300"></div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Remaining Time</p>
                          <p className={`text-2xl font-bold ${
                            remainingTime !== null && remainingTime < 0 
                              ? 'text-red-600' 
                              : remainingTime !== null && remainingTime === 0
                              ? 'text-green-600'
                              : 'text-blue-600'
                          }`}>
                            {remainingTime !== null ? `${Math.abs(remainingTime)} min` : '-'}
                            {remainingTime !== null && remainingTime < 0 && ' over'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Progress bar if total duration is set */}
                  {totalDurationValue > 0 && (
                    <div className="flex-1 min-w-[200px]">
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            calculatedDuration > totalDurationValue 
                              ? 'bg-red-500' 
                              : calculatedDuration === totalDurationValue
                              ? 'bg-green-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ 
                            width: `${Math.min((calculatedDuration / totalDurationValue) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 text-center">
                        {((calculatedDuration / totalDurationValue) * 100).toFixed(0)}% of training filled
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Exercise Picker */}
            {showExercisePicker && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border max-h-96 overflow-y-auto">
                <h3 className="font-medium text-gray-900 mb-3">Select an exercise:</h3>
                <div className="space-y-2">
                  {availableExercises
                    .filter(ex => !workoutExercises.find(we => we.exerciseId === ex.id))
                    .map((exercise) => (
                      <button
                        key={exercise.id}
                        type="button"
                        onClick={() => addExercise(exercise)}
                        className="w-full text-left p-3 bg-white rounded-lg border hover:border-blue-300 hover:shadow-sm transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{exercise.title}</h4>
                            {exercise.category && (
                              <p className="text-sm text-gray-500">{exercise.category.name}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {exercise.duration && <span>⏱️ {exercise.duration}min</span>}
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              exercise.difficulty === 'EASY' ? 'bg-green-100 text-green-700' :
                              exercise.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {exercise.difficulty}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Selected Exercises */}
            {workoutExercises.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No exercises added yet</p>
                <p className="text-sm mt-2">Click "Add Exercise" to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workoutExercises.map((workoutEx, index) => (
                  <div key={workoutEx.id} className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Order controls */}
                      <div className="flex flex-col gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => moveExercise(index, "up")}
                          disabled={index === 0}
                          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                          title="Move up"
                        >
                          ▲
                        </button>
                        <span className="text-sm font-bold text-blue-600 text-center px-2 py-1 bg-blue-50 rounded">
                          #{workoutEx.order}
                        </span>
                        <button
                          type="button"
                          onClick={() => moveExercise(index, "down")}
                          disabled={index === workoutExercises.length - 1}
                          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                          title="Move down"
                        >
                          ▼
                        </button>
                      </div>

                      {/* Exercise info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 text-lg mb-1">
                              {workoutEx.exercise.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              {workoutEx.exercise.category && (
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                  {workoutEx.exercise.category.name}
                                </span>
                              )}
                              <span className={`text-xs px-2 py-1 rounded ${
                                workoutEx.exercise.difficulty === 'EASY' ? 'bg-green-100 text-green-700' :
                                workoutEx.exercise.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {workoutEx.exercise.difficulty}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExercise(workoutEx.id, index)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove exercise"
                          >
                            <span className="text-xl">×</span>
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ⏱️ Duration (minutes)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={workoutEx.duration || ""}
                              onChange={(e) => updateExerciseDuration(workoutEx.id, index, parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              📝 Notes (optional)
                            </label>
                            <input
                              type="text"
                              value={workoutEx.notes || ""}
                              onChange={(e) => updateExerciseNotes(workoutEx.id, index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                              placeholder="e.g., Focus on technique"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <Link
              href={`/trainings/${unwrappedParams.id}`}
              className="py-3 px-6 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
