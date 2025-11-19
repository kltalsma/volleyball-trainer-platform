"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Exercise {
  id: string
  title: string
  description: string | null
  duration: number | null
  difficulty: string
  isPublic: boolean
  tags: string[]
  category: { id: string; name: string } | null
  creator: { id: string; name: string | null; email: string }
}

interface Category {
  id: string
  name: string
}

export default function ExercisesPage() {
  const router = useRouter()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter state
  const [categoryFilter, setCategoryFilter] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("")
  const [viewFilter, setViewFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExercises()
    }, 300)
    
    return () => clearTimeout(timer)
  }, [categoryFilter, difficultyFilter, viewFilter, searchQuery])

  // Initial load
  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  async function fetchExercises() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (categoryFilter) params.append("categoryId", categoryFilter)
      if (difficultyFilter) params.append("difficulty", difficultyFilter)
      if (viewFilter === "my") params.append("myExercises", "true")
      if (searchQuery) params.append("search", searchQuery)
      
      const response = await fetch(`/api/exercises?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        let filteredExercises = data.exercises
        
        // Client-side filter for public-only view
        if (viewFilter === "public") {
          filteredExercises = filteredExercises.filter((ex: Exercise) => ex.isPublic)
        }
        
        setExercises(filteredExercises)
      }
    } catch (error) {
      console.error("Error fetching exercises:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">🏐 Volleyball Exercise Library</h1>
            </div>
            <Link
              href="/exercises/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Create Exercise
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🏐 Volleyball Exercise Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select 
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Levels</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View
              </label>
              <select 
                value={viewFilter}
                onChange={(e) => setViewFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Exercises</option>
                <option value="my">My Exercises</option>
                <option value="public">Public Exercises</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <input
              type="text"
              placeholder="Search volleyball exercises by title, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Exercise List */}
        <div className="bg-white rounded-xl shadow-sm border p-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading exercises...</p>
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No volleyball exercises found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || categoryFilter || difficultyFilter || viewFilter !== "all" 
                  ? "Try adjusting your filters or search query"
                  : "Get started by creating your first volleyball training exercise with a court diagram"}
              </p>
              <div className="mt-6">
                <Link
                  href="/exercises/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Exercise
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exercises.map((exercise) => (
                <Link
                  key={exercise.id}
                  href={`/exercises/${exercise.id}`}
                  className="group border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-2">
                      {exercise.title}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      exercise.difficulty === "EASY" ? "bg-green-100 text-green-800" :
                      exercise.difficulty === "MEDIUM" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {exercise.difficulty}
                    </span>
                  </div>
                  
                  {exercise.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {exercise.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      {exercise.category && (
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {exercise.category.name}
                        </span>
                      )}
                      {exercise.duration && (
                        <span>⏱️ {exercise.duration}min</span>
                      )}
                    </div>
                    {exercise.isPublic ? (
                      <span className="text-blue-600">🌐 Public</span>
                    ) : (
                      <span className="text-gray-600">🔒 Private</span>
                    )}
                  </div>
                  
                  {exercise.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {exercise.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                    By {exercise.creator.name || exercise.creator.email}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
