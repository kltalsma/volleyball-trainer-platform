"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Sport {
  id: string
  name: string
}

interface Team {
  id: string
  name: string
  description: string | null
  sportId: string
  sport: Sport
}

interface Member {
  id: string
  role: string
  number: number | null
  position: string | null
  user: {
    id: string
    name: string | null
    email: string
  }
}

export default function EditTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const router = useRouter()
  const [sports, setSports] = useState<Sport[]>([])
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sportId: ""
  })

  const [showAddMember, setShowAddMember] = useState(false)
  const [memberForm, setMemberForm] = useState({
    email: "",
    name: "",
    role: "PLAYER",
    number: "",
    position: ""
  })

  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [memberEdits, setMemberEdits] = useState<Record<string, { role?: string; number?: number | null; position?: string | null }>>({})

  useEffect(() => {
    fetchTeam()
    fetchSports()
    fetchMembers()
    
    // Check if this is a new team (redirected from creation)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('new') === 'true') {
        setSuccess("Team created successfully! Now add your team members below.")
        setShowAddMember(true)
        // Remove the query param
        window.history.replaceState({}, '', `/teams/${unwrappedParams.id}/edit`)
      }
    }
  }, [unwrappedParams.id])

  async function fetchTeam() {
    try {
      const response = await fetch(`/api/teams/${unwrappedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setTeam(data)
        setFormData({
          name: data.name || "",
          description: data.description || "",
          sportId: data.sportId || ""
        })
      } else {
        setError("Failed to load team")
      }
    } catch (err) {
      console.error("Error fetching team:", err)
      setError("An error occurred while loading the team")
    } finally {
      setLoading(false)
    }
  }

  async function fetchSports() {
    try {
      const response = await fetch("/api/sports")
      if (response.ok) {
        const data = await response.json()
        setSports(data)
      }
    } catch (error) {
      console.error("Error fetching sports:", error)
    }
  }

  async function fetchMembers() {
    try {
      const response = await fetch(`/api/team-members?teamId=${unwrappedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error("Error fetching members:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!formData.name || !formData.sportId) {
      setError("Team name and sport are required")
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/teams/${unwrappedParams.id}`, {
        method: "PATCH",
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
        setError(data.error || "Failed to update team")
        setSaving(false)
        return
      }

      setSuccess("Team updated successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error updating team:", err)
      setError("An unexpected error occurred")
    } finally {
      setSaving(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!memberForm.email || !memberForm.name) {
      setError("Email and name are required")
      return
    }

    try {
      const response = await fetch("/api/team-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId: unwrappedParams.id,
          ...memberForm,
          number: memberForm.number ? parseInt(memberForm.number) : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to add member")
        return
      }

      setSuccess("Member added successfully!")
      setShowAddMember(false)
      setMemberForm({
        email: "",
        name: "",
        role: "PLAYER",
        number: "",
        position: ""
      })
      fetchMembers()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error adding member:", err)
      setError("An unexpected error occurred")
    }
  }

  const handleUpdateMember = async (memberId: string) => {
    setError("")
    setSuccess("")

    const updates = memberEdits[memberId]
    
    if (!updates || Object.keys(updates).length === 0) {
      setError("No changes to save")
      return
    }

    try {
      const response = await fetch(`/api/team-members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to update member")
        return
      }
      
      setSuccess("Member updated successfully!")
      setEditingMember(null)
      setMemberEdits({})
      fetchMembers()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error updating member:", err)
      setError("An unexpected error occurred")
    }
  }

  const updateMemberEdit = (memberId: string, field: string, value: any) => {
    setMemberEdits(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [field]: value
      }
    }))
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member from the team?")) {
      return
    }

    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/team-members/${memberId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to remove member")
        return
      }

      setSuccess("Member removed successfully!")
      fetchMembers()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error removing member:", err)
      setError("An unexpected error occurred")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team...</p>
        </div>
      </div>
    )
  }

  if (error && !team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/teams" className="text-gray-600 hover:text-gray-900">
              ← Back to Teams
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
            <Link href={`/teams/${unwrappedParams.id}`} className="text-gray-600 hover:text-gray-900">
              ← Back to Team
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Edit Team</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Success/Error Messages */}
          {error && (
            <div className="rounded-lg bg-red-50 p-4 border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="rounded-lg bg-green-50 p-4 border border-green-200">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Team Information Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Team Information</h2>
            
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
                placeholder="e.g., OPM Heerenveen U19"
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
                placeholder="Team description, level, age group, etc."
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
                value={sports.find(s => s.id === formData.sportId)?.name || team?.sport?.name || "Volleyball"}
                readOnly
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>

            {/* Submit button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Saving..." : "Save Team Info"}
              </button>
            </div>
          </form>

          {/* Team Members Section */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Team Members ({members.length})
              </h2>
              <button
                type="button"
                onClick={() => setShowAddMember(!showAddMember)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {showAddMember ? "Cancel" : "+ Add Member"}
              </button>
            </div>

            {/* Add Member Form */}
            {showAddMember && (
              <form onSubmit={handleAddMember} className="mb-6 p-4 bg-gray-50 rounded-lg border space-y-4">
                <h3 className="font-medium text-gray-900">Add New Member</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={memberForm.email}
                      onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      placeholder="member@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={memberForm.name}
                      onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      value={memberForm.role}
                      onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    >
                      <option value="PLAYER">Player</option>
                      <option value="COACH">Coach</option>
                      <option value="ASSISTANT_COACH">Assistant Coach</option>
                      <option value="PARENT">Parent</option>
                      <option value="VOLUNTEER">Volunteer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jersey Number
                    </label>
                    <input
                      type="number"
                      value={memberForm.number}
                      onChange={(e) => setMemberForm({ ...memberForm, number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      placeholder="e.g., 7"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <input
                      type="text"
                      value={memberForm.position}
                      onChange={(e) => setMemberForm({ ...memberForm, position: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      placeholder="e.g., Outside Hitter, Setter, Libero"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddMember(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Members List */}
            {members.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No members yet. Add your first team member!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 bg-gray-50 rounded-lg border hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">
                            {member.user.name || member.user.email}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            member.role === 'COACH' ? 'bg-purple-100 text-purple-700' :
                            member.role === 'ASSISTANT_COACH' ? 'bg-blue-100 text-blue-700' :
                            member.role === 'PLAYER' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {member.role.replace('_', ' ')}
                          </span>
                          {member.number && (
                            <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">
                              #{member.number}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>{member.user.email}</p>
                          {member.position && <p>Position: {member.position}</p>}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingMember(editingMember === member.id ? null : member.id)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          {editingMember === member.id ? "Cancel" : "Edit"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(member.id)}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Edit Member Form */}
                    {editingMember === member.id && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Role
                            </label>
                            <select
                              value={memberEdits[member.id]?.role ?? member.role}
                              onChange={(e) => updateMemberEdit(member.id, 'role', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            >
                              <option value="PLAYER">Player</option>
                              <option value="COACH">Coach</option>
                              <option value="ASSISTANT_COACH">Assistant Coach</option>
                              <option value="PARENT">Parent</option>
                              <option value="VOLUNTEER">Volunteer</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Number
                            </label>
                            <input
                              type="number"
                              value={(memberEdits[member.id]?.number !== undefined ? memberEdits[member.id]?.number : member.number) ?? ""}
                              onChange={(e) => {
                                const value = e.target.value
                                updateMemberEdit(member.id, 'number', value ? parseInt(value, 10) : null)
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                              placeholder="Jersey #"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Position
                            </label>
                            <input
                              type="text"
                              value={memberEdits[member.id]?.position ?? member.position ?? ""}
                              onChange={(e) => updateMemberEdit(member.id, 'position', e.target.value || null)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                              placeholder="Position"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateMember(member.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMember(null)
                              setMemberEdits(prev => {
                                const newEdits = { ...prev }
                                delete newEdits[member.id]
                                return newEdits
                              })
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Back Button */}
          <div className="flex justify-end">
            <Link
              href={`/teams/${unwrappedParams.id}`}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Done
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
