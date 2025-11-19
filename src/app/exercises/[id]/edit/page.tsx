"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import DrawingCanvas from "@/components/drawing-canvas"

interface Sport {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
}

interface Exercise {
  id: string
  title: string
  description: string | null
  duration: number | null
  difficulty: string
  sportId: string
  categoryId: string | null
  isPublic: boolean
  videoUrl: string | null
  tags: string[]
  diagram: string | null
  creatorId: string
}

export default function EditExercisePage() {
  const router = useRouter()
  const params = useParams()
  const exerciseId = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")
  const [sports, setSports] = useState<Sport[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [exercise, setExercise] = useState<Exercise | null>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    difficulty: "MEDIUM",
    sportId: "",
    categoryId: "",
    isPublic: false,
    videoUrl: "",
    tags: "",
    diagram: ""
  })

  // Fetch exercise data
  useEffect(() => {
    if (!exerciseId) return
    
    async function fetchExercise() {
      try {
        const response = await fetch(`/api/exercises/${exerciseId}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError("Exercise not found")
          } else if (response.status === 403) {
            setError("You don't have permission to edit this exercise")
          } else {
            setError("Failed to load exercise")
          }
          setFetching(false)
          return
        }
        
        const data = await response.json()
        setExercise(data)
        
        // Populate form
        setFormData({
          title: data.title,
          description: data.description || "",
          duration: data.duration?.toString() || "",
          difficulty: data.difficulty,
          sportId: data.sportId,
          categoryId: data.categoryId || "",
          isPublic: data.isPublic,
          videoUrl: data.videoUrl || "",
          tags: data.tags.join(", "),
          diagram: data.diagram || ""
        })
        
        setFetching(false)
      } catch (err) {
        console.error("Error fetching exercise:", err)
        setError("Failed to load exercise")
        setFetching(false)
      }
    }
    
    fetchExercise()
  }, [exerciseId])

  // Fetch sports and categories
  useEffect(() => {
    async function fetchData() {
      try {
        const [sportsRes, categoriesRes] = await Promise.all([
          fetch("/api/sports"),
          fetch("/api/categories")
        ])
        
        if (sportsRes.ok) {
          const sportsData = await sportsRes.json()
          setSports(sportsData)
        }
        
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData)
        }
      } catch (err) {
        console.error("Error fetching data:", err)
      }
    }
    
    fetchData()
  }, [])

  const handleDiagramChange = useCallback((diagram: string) => {
    setFormData(prev => ({ ...prev, diagram }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.title) {
      setError("Title is required")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/exercises/${exerciseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          duration: formData.duration ? parseInt(formData.duration) : undefined,
          difficulty: formData.difficulty,
          categoryId: formData.categoryId || undefined,
          isPublic: formData.isPublic,
          videoUrl: formData.videoUrl || undefined,
          tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
          diagram: formData.diagram || undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to update exercise")
        setLoading(false)
        return
      }

      router.push(`/exercises/${exerciseId}`)
      router.refresh()
    } catch (err) {
      console.error("Error updating exercise:", err)
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exercise...</p>
        </div>
      </div>
    )
  }

  if (error && !exercise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/exercises" className="text-blue-600 hover:text-blue-700">
            ← Back to Exercises
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/exercises/${exerciseId}`} className="text-gray-600 hover:text-gray-900">
              ← Back to Exercise
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Edit Exercise</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Exercise Title *
            </label>
            <input
              id="title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Passing drill with target zones"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detailed description of the exercise..."
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Duration and Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                id="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="15"
              />
            </div>

            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                id="difficulty"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          {/* Video URL */}
          <div>
            <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Video URL (optional)
            </label>
            <input
              id="videoUrl"
              type="url"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              id="tags"
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="passing, defense, warm-up"
            />
          </div>

          {/* Drawing Canvas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Court Diagram
            </label>
            <DrawingCanvas 
              onChange={handleDiagramChange}
              initialDiagram={formData.diagram}
            />
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
              Make this exercise public (visible to all users)
            </label>
          </div>

          {/* Submit buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <Link
              href={`/exercises/${exerciseId}`}
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
