"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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

interface SelectedExercise {
  exerciseId: string
  exercise: Exercise
  order: number
  duration: number
  notes: string
}

export default function NewTrainingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedTeamId = searchParams.get("teamId")
  const preselectedExerciseId = searchParams.get("exerciseId")
  
  const [teams, setTeams] = useState<Team[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    teamId: preselectedTeamId || "",
    isPublic: false,
    startTime: "",
    endTime: "",
    totalDuration: ""
  })

  useEffect(() => {
    fetchTeams()
    fetchExercises()
  }, [])

  // Pre-select exercise if provided in URL
  useEffect(() => {
    if (preselectedExerciseId && exercises.length > 0 && selectedExercises.length === 0) {
      const exercise = exercises.find(ex => ex.id === preselectedExerciseId)
      if (exercise) {
        const newExercise: SelectedExercise = {
          exerciseId: exercise.id,
          exercise,
          order: 1,
          duration: exercise.duration || 10,
          notes: ""
        }
        setSelectedExercises([newExercise])
      }
    }
  }, [preselectedExerciseId, exercises, selectedExercises.length])

  async function fetchTeams() {
    try {
      // Fetch all teams so trainers can create trainings for any team (substitute trainer use case)
      const response = await fetch("/api/teams")
      if (response.ok) {
        const data = await response.json()
        console.log("Teams loaded:", data.teams)
        setTeams(data.teams || [])
      } else {
        console.error("Failed to fetch teams:", response.status)
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
    }
  }

  async function fetchExercises() {
    try {
      const response = await fetch("/api/exercises?limit=100")
      if (response.ok) {
        const data = await response.json()
        setExercises(data.exercises || [])
      }
    } catch (error) {
      console.error("Error fetching exercises:", error)
    }
  }

  const addExercise = (exercise: Exercise) => {
    const newExercise: SelectedExercise = {
      exerciseId: exercise.id,
      exercise,
      order: selectedExercises.length + 1,
      duration: exercise.duration || 10,
      notes: ""
    }
    setSelectedExercises([...selectedExercises, newExercise])
    setShowExercisePicker(false)
  }

  const removeExercise = (index: number) => {
    const updated = selectedExercises.filter((_, i) => i !== index)
    // Reorder
    updated.forEach((ex, i) => {
      ex.order = i + 1
    })
    setSelectedExercises(updated)
  }

  const moveExercise = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= selectedExercises.length) return
    
    const updated = [...selectedExercises]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    
    // Reorder
    updated.forEach((ex, i) => {
      ex.order = i + 1
    })
    setSelectedExercises(updated)
  }

  const updateExerciseDuration = (index: number, duration: number) => {
    const updated = [...selectedExercises]
    updated[index].duration = duration
    setSelectedExercises(updated)
  }

  const updateExerciseNotes = (index: number, notes: string) => {
    const updated = [...selectedExercises]
    updated[index].notes = notes
    setSelectedExercises(updated)
  }

  // Calculate total duration from selected exercises
  const calculatedDuration = selectedExercises.reduce((sum, ex) => sum + ex.duration, 0)
  
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

    setLoading(true)

    try {
      // Create the training
      const trainingResponse = await fetch("/api/workouts", {
        method: "POST",
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

      const trainingData = await trainingResponse.json()

      if (!trainingResponse.ok) {
        console.error("Workout creation failed:", trainingData)
        const errorMsg = trainingData.details ? `${trainingData.error}: ${trainingData.details}` : trainingData.error
        setError(errorMsg || "Failed to create training")
        setLoading(false)
        return
      }

      // Add exercises to the training
      if (selectedExercises.length > 0) {
        await Promise.all(
          selectedExercises.map(ex =>
            fetch("/api/workout-exercises", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                workoutId: trainingData.id,
                exerciseId: ex.exerciseId,
                order: ex.order,
                duration: ex.duration,
                notes: ex.notes || undefined
              }),
            })
          )
        )
      }

      router.push(`/trainings/${trainingData.id}`)
      router.refresh()
    } catch (err) {
      console.error("Error creating training:", err)
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/trainings" className="text-gray-600 hover:text-gray-900">
              ← Back to Trainings
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create New Training</h1>
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
                onChange={(e) => {
                  console.log("Title input changed:", e.target.value)
                  setFormData({ ...formData, title: e.target.value })
                }}
                onFocus={() => console.log("Title input focused")}
                onKeyDown={(e) => console.log("Key pressed:", e.key)}
                readOnly={false}
                disabled={false}
                autoComplete="off"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                placeholder="e.g., Advanced Serving Practice"
                style={{ pointerEvents: 'auto', userSelect: 'text' }}
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
                onChange={(e) => {
                  console.log("Description changed:", e.target.value)
                  setFormData({ ...formData, description: e.target.value })
                }}
                onFocus={() => console.log("Description focused")}
                readOnly={false}
                disabled={false}
                autoComplete="off"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                placeholder="Training goals and focus areas..."
                style={{ pointerEvents: 'auto', userSelect: 'text' }}
              />
            </div>

            {/* Team */}
            <div>
              <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-2">
                Team
              </label>
              <div className="relative">
                <select
                  id="team"
                  value={formData.teamId}
                  onChange={(e) => {
                    console.log("Team dropdown changed:", e.target.value)
                    setFormData({ ...formData, teamId: e.target.value })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 cursor-pointer appearance-none pr-10"
                >
                  <option value="">No team (personal)</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-gray-500 mt-1">
                  Teams loaded: {teams.length} | Selected: {formData.teamId || 'none'}
                </p>
              )}
            </div>

            {/* Time Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Start Date & Time
                </label>
                <input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => {
                    console.log("Start time changed:", e.target.value)
                    setFormData({ ...formData, startTime: e.target.value })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 cursor-pointer"
                  step="300"
                />
                <p className="text-xs text-gray-500 mt-1">Click to select date and time</p>
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                  📅 End Date & Time
                </label>
                <input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => {
                    console.log("End time changed:", e.target.value)
                    setFormData({ ...formData, endTime: e.target.value })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 cursor-pointer"
                  step="300"
                />
                <p className="text-xs text-gray-500 mt-1">Click to select date and time</p>
              </div>

              <div>
                <label htmlFor="totalDuration" className="block text-sm font-medium text-gray-700 mb-2">
                  ⏱️ Total Duration (min)
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
                <p className="text-xs text-gray-500 mt-1">Optional: Total training length</p>
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
            {selectedExercises.length > 0 && (
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
                  {exercises
                    .filter(ex => !selectedExercises.find(sel => sel.exerciseId === ex.id))
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
            {selectedExercises.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No exercises added yet</p>
                <p className="text-sm mt-2">Click "Add Exercise" to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedExercises.map((selected, index) => (
                  <div key={index} className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
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
                          #{selected.order}
                        </span>
                        <button
                          type="button"
                          onClick={() => moveExercise(index, "down")}
                          disabled={index === selectedExercises.length - 1}
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
                              {selected.exercise.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              {selected.exercise.category && (
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                  {selected.exercise.category.name}
                                </span>
                              )}
                              <span className={`text-xs px-2 py-1 rounded ${
                                selected.exercise.difficulty === 'EASY' ? 'bg-green-100 text-green-700' :
                                selected.exercise.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {selected.exercise.difficulty}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExercise(index)}
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
                              value={selected.duration}
                              onChange={(e) => updateExerciseDuration(index, parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              📝 Notes (optional)
                            </label>
                            <input
                              type="text"
                              value={selected.notes}
                              onChange={(e) => updateExerciseNotes(index, e.target.value)}
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
              disabled={loading}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating..." : "Create Training"}
            </button>
            <Link
              href="/trainings"
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
