"use client"

import { useState } from "react"
import Link from "next/link"

interface Team {
  id: string
  name: string
  category: string
  number: number
  ranking: string | null
  apiId: string
}

interface ApiResponse {
  success: boolean
  clubId: string
  totalTeams: number
  teams: Team[]
}

export default function VolleybalNLPage() {
  const [clubId, setClubId] = useState("ckl6f7m") // Default: OPM Heerenveen
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [data, setData] = useState<ApiResponse | null>(null)

  const fetchTeams = async () => {
    if (!clubId.trim()) {
      setError("Please enter a club ID")
      return
    }

    setLoading(true)
    setError("")
    setData(null)

    try {
      const response = await fetch(`/api/volleybalnl/teams?clubId=${clubId}`)
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to fetch teams")
        return
      }

      setData(result)
    } catch (err) {
      console.error("Error fetching teams:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Volleybal.nl Integration
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>How to find your Club ID:</strong> Visit your club page on{" "}
              <a
                href="https://www.volleybal.nl"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Volleybal.nl
              </a>
              . The Club ID is in the URL, e.g., <code className="bg-blue-100 px-1 rounded">volleybal.nl/competitie/vereniging/ckl6f7m</code> → Club ID is <code className="bg-blue-100 px-1 rounded">ckl6f7m</code>
            </p>
          </div>

          {/* Search Card */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Fetch Teams from Volleybal.nl
            </h2>

            <div className="flex gap-4">
              <input
                type="text"
                value={clubId}
                onChange={(e) => setClubId(e.target.value)}
                placeholder="Enter Club ID (e.g., ckl6f7m)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === "Enter" && fetchTeams()}
              />
              <button
                onClick={fetchTeams}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Loading..." : "Fetch Teams"}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-4 border border-red-200">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>

          {/* Results */}
          {data && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Teams Found
                </h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {data.totalTeams} teams
                </span>
              </div>

              <div className="space-y-3">
                {data.teams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{team.name}</h3>
                      {team.ranking && (
                        <p className="text-sm text-gray-600 mt-1">
                          {team.ranking}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Category: {team.category} #{team.number}
                      </p>
                    </div>
                    <div className="ml-4">
                      <a
                        href={`https://www.volleybal.nl${team.apiId.replace('/competitie/teams/', '/competitie/vereniging/')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        View on Volleybal.nl →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
