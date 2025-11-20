"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Sport {
  id: string
  name: string
}

interface VolleybalTeam {
  id: string
  name: string
  category: string
  number: number
  ranking: string | null
  apiId: string
}

export default function NewTeamPage() {
  const router = useRouter()
  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Volleybal.nl integration
  const [clubId, setClubId] = useState("")
  const [fetchingTeams, setFetchingTeams] = useState(false)
  const [volleybalTeams, setVolleybalTeams] = useState<VolleybalTeam[]>([])
  const [selectedVolleybalTeam, setSelectedVolleybalTeam] = useState<string>("")
  const [showVolleybalIntegration, setShowVolleybalIntegration] = useState(false)
  
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

  async function fetchVolleybalTeams() {
    if (!clubId.trim()) {
      setError("Please enter a club ID")
      return
    }

    setFetchingTeams(true)
    setError("")

    try {
      const response = await fetch(`/api/volleybalnl/teams?clubId=${clubId}`)
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to fetch teams from Volleybal.nl")
        setVolleybalTeams([])
        return
      }

      setVolleybalTeams(result.teams || [])
    } catch (err) {
      console.error("Error fetching Volleybal.nl teams:", err)
      setError("An unexpected error occurred while fetching teams")
      setVolleybalTeams([])
    } finally {
      setFetchingTeams(false)
    }
  }

  function handleSelectVolleybalTeam(teamId: string) {
    setSelectedVolleybalTeam(teamId)
    const team = volleybalTeams.find(t => t.id === teamId)
    if (team) {
      // Format category nicely (e.g., "meiden-b" -> "Meiden B")
      const formattedCategory = team.category
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      // Build description with ranking info
      const descriptionParts: string[] = []
      if (team.ranking) {
        descriptionParts.push(team.ranking)
      }
      descriptionParts.push(`Team: ${formattedCategory} ${team.number}`)
      descriptionParts.push(`Imported from Volleybal.nl`)
      
      setFormData(prev => ({
        ...prev,
        name: team.name,
        description: descriptionParts.join('\n')
      }))
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
      const selectedTeam = volleybalTeams.find(t => t.id === selectedVolleybalTeam)
      
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          sportId: formData.sportId,
          // Include Volleybal.nl data if team was selected
          ...(selectedTeam && {
            volleybalNlApiId: selectedTeam.apiId,
            volleybalNlClubId: clubId,
            volleybalNlCategory: selectedTeam.category,
            volleybalNlTeamNumber: selectedTeam.number
          })
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
        {/* Volleybal.nl Integration Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Import from Volleybal.nl
            </h2>
            <button
              type="button"
              onClick={() => setShowVolleybalIntegration(!showVolleybalIntegration)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showVolleybalIntegration ? "Hide" : "Show"}
            </button>
          </div>

          {showVolleybalIntegration && (
            <>
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
                  . The Club ID is in the URL, e.g.,{" "}
                  <code className="bg-blue-100 px-1 rounded">
                    volleybal.nl/competitie/vereniging/ckl6f7m
                  </code>{" "}
                  → Club ID is <code className="bg-blue-100 px-1 rounded">ckl6f7m</code>
                </p>
              </div>

              <div className="flex gap-4">
                <input
                  type="text"
                  value={clubId}
                  onChange={(e) => setClubId(e.target.value)}
                  placeholder="Enter Club ID (e.g., ckl6f7m)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), fetchVolleybalTeams())}
                />
                <button
                  type="button"
                  onClick={fetchVolleybalTeams}
                  disabled={fetchingTeams}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {fetchingTeams ? "Loading..." : "Fetch Teams"}
                </button>
              </div>

              {volleybalTeams.length > 0 && (
                <div>
                  <label htmlFor="volleybal-team" className="block text-sm font-medium text-gray-700 mb-2">
                    Select a team from Volleybal.nl
                  </label>
                  <select
                    id="volleybal-team"
                    value={selectedVolleybalTeam}
                    onChange={(e) => handleSelectVolleybalTeam(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    <option value="">-- Select a team --</option>
                    {volleybalTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} {team.ranking ? `- ${team.ranking}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              placeholder="e.g., OPM Heerenveen Dames 1"
            />
            {selectedVolleybalTeam && (
              <p className="mt-1 text-sm text-green-600">
                ✓ Imported from Volleybal.nl
              </p>
            )}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
