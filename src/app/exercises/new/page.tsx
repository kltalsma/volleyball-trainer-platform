"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
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

export default function NewExercisePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sports, setSports] = useState<Sport[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [volleyballSportId, setVolleyballSportId] = useState<string>("")
  
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
    diagram: "",
    // Enhanced filtering fields
    techniques: [] as string[],
    playerMin: "",
    playerMax: "",
    skillLevel: "",
    materials: ""
  })

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
          
          // Auto-select volleyball sport (prefer exact match "Volleyball" over "Beach Volleyball")
          const volleyball = sportsData.find((s: Sport) => 
            s.name.toLowerCase() === "volleyball"
          ) || sportsData.find((s: Sport) => 
            s.name.toLowerCase().includes("volleyball")
          )
          if (volleyball) {
            setVolleyballSportId(volleyball.id)
            setFormData(prev => ({ ...prev, sportId: volleyball.id }))
          }
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

    if (!formData.title || !formData.sportId) {
      setError("Title and sport are required")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/exercises", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          duration: formData.duration ? parseInt(formData.duration) : undefined,
          difficulty: formData.difficulty,
          sportId: formData.sportId,
          categoryId: formData.categoryId || undefined,
          isPublic: formData.isPublic,
          videoUrl: formData.videoUrl || undefined,
          tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
          diagram: formData.diagram || undefined,
          // Enhanced filtering fields
          techniques: formData.techniques.length > 0 ? formData.techniques : undefined,
          playerMin: formData.playerMin ? parseInt(formData.playerMin) : undefined,
          playerMax: formData.playerMax ? parseInt(formData.playerMax) : undefined,
          skillLevel: formData.skillLevel || undefined,
          materials: formData.materials ? JSON.parse(formData.materials) : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create exercise")
        setLoading(false)
        return
      }

      router.push("/exercises")
      router.refresh()
    } catch (err) {
      console.error("Error creating exercise:", err)
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/exercises" className="text-gray-600 hover:text-gray-900">
              ← Back to Exercises
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create New Exercise</h1>
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

          {/* Category only - Sport is hardcoded to Volleyball */}
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

          {/* Enhanced Filtering Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Exercise Details (for better filtering)</h3>
            
            {/* Techniques - Multi-select */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volleyball Techniques
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['Attack', 'Defense', 'Serve', 'Pass', 'Block', 'Set'].map((tech) => (
                  <label key={tech} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.techniques.includes(tech.toLowerCase())}
                      onChange={(e) => {
                        const value = tech.toLowerCase()
                        setFormData({
                          ...formData,
                          techniques: e.target.checked
                            ? [...formData.techniques, value]
                            : formData.techniques.filter(t => t !== value)
                        })
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{tech}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Player Count and Skill Level */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="playerMin" className="block text-sm font-medium text-gray-700 mb-2">
                  Min Players
                </label>
                <input
                  id="playerMin"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.playerMin}
                  onChange={(e) => setFormData({ ...formData, playerMin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="4"
                />
              </div>

              <div>
                <label htmlFor="playerMax" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Players
                </label>
                <input
                  id="playerMax"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.playerMax}
                  onChange={(e) => setFormData({ ...formData, playerMax: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="12"
                />
              </div>

              <div>
                <label htmlFor="skillLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  Skill Level
                </label>
                <select
                  id="skillLevel"
                  value={formData.skillLevel}
                  onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any level</option>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
            </div>

            {/* Materials - JSON input (simplified) */}
            <div className="mt-4">
              <label htmlFor="materials" className="block text-sm font-medium text-gray-700 mb-2">
                Materials (optional, JSON format)
              </label>
              <input
                id="materials"
                type="text"
                value={formData.materials}
                onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder='[{"name": "Balls", "quantity": 8}, {"name": "Cones", "quantity": 4}]'
              />
              <p className="mt-1 text-xs text-gray-500">
                Example: [&#123;"name": "Balls", "quantity": 8&#125;, &#123;"name": "Cones", "quantity": 4&#125;]
              </p>
            </div>
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
              {loading ? "Creating..." : "Create Exercise"}
            </button>
            <Link
              href="/exercises"
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
