"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Training {
  id: string
  title: string
  description: string | null
  team: {
    id: string
    name: string
  } | null
}

interface AddToTrainingButtonProps {
  exerciseId: string
  exerciseTitle: string
  exerciseDuration: number | null
}

export default function AddToTrainingButton({ 
  exerciseId, 
  exerciseTitle,
  exerciseDuration 
}: AddToTrainingButtonProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedTrainingId, setSelectedTrainingId] = useState("")
  const [customDuration, setCustomDuration] = useState(exerciseDuration || 10)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (showModal) {
      fetchTrainings()
    }
  }, [showModal])

  async function fetchTrainings() {
    try {
      setLoading(true)
      const response = await fetch("/api/workouts")
      if (response.ok) {
        const data = await response.json()
        setTrainings(data.workouts || [])
      } else {
        setError("Failed to fetch trainings")
      }
    } catch (err) {
      console.error("Error fetching trainings:", err)
      setError("Failed to load trainings")
    } finally {
      setLoading(false)
    }
  }

  async function handleAddToTraining() {
    if (!selectedTrainingId) {
      setError("Please select a training")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Get the current max order for this training
      const orderResponse = await fetch(`/api/workout-exercises?workoutId=${selectedTrainingId}`)
      let maxOrder = 0
      
      if (orderResponse.ok) {
        const data = await orderResponse.json()
        const exercises = data.exercises || []
        maxOrder = exercises.length > 0 
          ? Math.max(...exercises.map((ex: any) => ex.order)) 
          : 0
      }

      // Add the exercise
      const response = await fetch("/api/workout-exercises", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workoutId: selectedTrainingId,
          exerciseId,
          order: maxOrder + 1,
          duration: customDuration,
          notes: notes || undefined
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add exercise")
      }

      // Success! Close modal and navigate to training
      setShowModal(false)
      router.push(`/trainings/${selectedTrainingId}`)
      router.refresh()
    } catch (err: any) {
      console.error("Error adding exercise:", err)
      setError(err.message || "Failed to add exercise to training")
      setLoading(false)
    }
  }

  function handleCreateNew() {
    setShowModal(false)
    // Navigate to training creation with pre-selected exercise
    router.push(`/trainings/new?exerciseId=${exerciseId}`)
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
      >
        <span>➕</span>
        Add to Training
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add to Training</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              {/* Exercise Info */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Adding exercise:</p>
                <p className="font-semibold text-gray-900">{exerciseTitle}</p>
              </div>

              {/* Select Training */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Training *
                </label>
                <select
                  value={selectedTrainingId}
                  onChange={(e) => setSelectedTrainingId(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Choose a training --</option>
                  {trainings.map((training) => (
                    <option key={training.id} value={training.id}>
                      {training.title}
                      {training.team && ` (${training.team.name})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Focus on technique, increase intensity..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleAddToTraining}
                  disabled={loading || !selectedTrainingId}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Adding..." : "Add to Training"}
                </button>
                <button
                  onClick={handleCreateNew}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create New Training
                </button>
              </div>

              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
