"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Sport {
  id: string
  name: string
}

export default function NewTeamPage() {
  const router = useRouter()
  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sportId: ""
  })

  useEffect(() => {
    fetchSports()
  }, [])

  async function fetchSports() {
    try {
      const response = await fetch("/api/sports")
      if (response.ok) {
        const data = await response.json()
        setSports(data)
        
        // Auto-select volleyball if available (prefer exact match "Volleyball" over "Beach Volleyball")
        const volleyball = data.find((s: Sport) => 
          s.name.toLowerCase() === "volleyball"
        ) || data.find((s: Sport) => 
          s.name.toLowerCase().includes("volleyball")
        )
        if (volleyball) {
          setFormData(prev => ({ ...prev, sportId: volleyball.id }))
        }
      }
    } catch (error) {
      console.error("Error fetching sports:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name || !formData.sportId) {
      setError("Team name and sport are required")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          sportId: formData.sportId
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create team")
        setLoading(false)
        return
      }

      // Redirect to edit page to add members
      router.push(`/teams/${data.id}/edit?new=true`)
      router.refresh()
    } catch (err) {
      console.error("Error creating team:", err)
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
            <Link href="/teams" className="text-gray-600 hover:text-gray-900">
              ← Back to Teams
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create New Team</h1>
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

          {/* Team Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Team Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., OPM Heerenveen Dames 1"
            />
          </div>

          {/* Sport - Read-only (volleyball only) */}
          <div>
            <label htmlFor="sport" className="block text-sm font-medium text-gray-700 mb-2">
              Sport
            </label>
            <input
              id="sport"
              type="text"
              value={sports.find(s => s.id === formData.sportId)?.name || "Volleyball"}
              readOnly
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
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
              placeholder="Team description, level, goals, etc."
            />
          </div>

          {/* Info message */}
          <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 After creating your team, you'll be able to add players, coaches, and other members.
            </p>
          </div>

          {/* Submit buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating..." : "Create Team"}
            </button>
            <Link
              href="/teams"
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
