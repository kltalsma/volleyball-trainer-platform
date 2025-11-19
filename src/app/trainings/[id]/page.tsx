"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Exercise {
  id: string
  workoutId: string
  exerciseId: string
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
    tags: string[]
    category: {
      id: string
      name: string
    } | null
  }
}

interface Training {
  id: string
  title: string
  description: string | null
  startTime: string | null
  endTime: string | null
  totalDuration: number | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
  creator: {
    id: string
    name: string | null
    email: string
  }
  team: {
    id: string
    name: string
  } | null
  _count: {
    exercises: number
  }
}

export default function TrainingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const unwrappedParams = use(params)
  const [training, setTraining] = useState<Training | null>(null)
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchTraining()
    fetchExercises()
  }, [unwrappedParams.id])

  async function fetchTraining() {
    try {
      const response = await fetch(`/api/workouts/${unwrappedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setTraining(data)
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

  async function fetchExercises() {
    try {
      const response = await fetch(`/api/workout-exercises?workoutId=${unwrappedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setExercises(data.exercises || [])
      }
    } catch (err) {
      console.error("Error fetching exercises:", err)
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this training?")) {
      return
    }

    setDeleting(true)

    try {
      const response = await fetch(`/api/workouts/${unwrappedParams.id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        router.push("/trainings")
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete training")
      }
    } catch (err) {
      console.error("Error deleting training:", err)
      setError("An error occurred while deleting the training")
    } finally {
      setDeleting(false)
    }
  }

  function formatDateTime(dateString: string | null) {
    if (!dateString) return "Not set"
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "Not set"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  function calculateTotalDuration() {
    if (training?.totalDuration) {
      return training.totalDuration
    }
    return exercises.reduce((total, ex) => total + (ex.duration || 0), 0)
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

  if (error || !training) {
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
            <p className="text-red-800">{error || "Training not found"}</p>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/trainings" className="text-gray-600 hover:text-gray-900">
                ← Back to Trainings
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/trainings/${params.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Edit Training
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Training Info */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{training.title}</h1>
              {training.team && (
                <Link 
                  href={`/teams/${training.team.id}`}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                  👥 {training.team.name}
                </Link>
              )}
            </div>
            {training.isPublic && (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                Public
              </span>
            )}
          </div>

          {training.description && (
            <p className="text-gray-600 mb-6 whitespace-pre-wrap">{training.description}</p>
          )}

          {/* Time & Duration Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 mb-1">Start Time</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDateTime(training.startTime)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">End Time</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDateTime(training.endTime)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Duration</p>
              <p className="text-sm font-medium text-gray-900">
                {calculateTotalDuration()} minutes
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Exercises</p>
              <p className="text-sm font-medium text-gray-900">
                {training._count.exercises} {training._count.exercises === 1 ? "exercise" : "exercises"}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="mt-6 pt-4 border-t flex items-center justify-between text-sm text-gray-500">
            <div>
              Created by <span className="font-medium text-gray-700">{training.creator.name || training.creator.email}</span>
            </div>
            <div>
              Created {formatDate(training.createdAt)}
            </div>
          </div>
        </div>

        {/* Exercises */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Training Plan</h2>
          
          {exercises.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No exercises added yet</p>
              <Link
                href={`/trainings/${params.id}/edit`}
                className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add Exercises
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {exercises.map((exercise, index) => (
                <div
                  key={exercise.id}
                  className="p-4 bg-gray-50 rounded-lg border hover:border-blue-300 hover:shadow-sm transition"
                >
                  <div className="flex items-start gap-4">
                    {/* Order number */}
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                      {exercise.order}
                    </div>

                    {/* Exercise details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Link
                            href={`/exercises/${exercise.exerciseId}`}
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                          >
                            {exercise.exercise.title}
                          </Link>
                          {exercise.exercise.category && (
                            <p className="text-sm text-gray-500 mt-1">
                              {exercise.exercise.category.name}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          {exercise.duration && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                              ⏱️ {exercise.duration} min
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full font-medium ${
                            exercise.exercise.difficulty === 'EASY' ? 'bg-green-100 text-green-700' :
                            exercise.exercise.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {exercise.exercise.difficulty}
                          </span>
                        </div>
                      </div>

                      {exercise.exercise.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {exercise.exercise.description}
                        </p>
                      )}

                      {exercise.notes && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-xs font-medium text-yellow-800 mb-1">Notes:</p>
                          <p className="text-sm text-gray-700">{exercise.notes}</p>
                        </div>
                      )}

                      {exercise.exercise.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {exercise.exercise.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
