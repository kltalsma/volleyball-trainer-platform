'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Team {
  id: string
  name: string
  sport: { name: string }
}

interface AddUserToTeamProps {
  userEmail: string
  userName: string | null
  availableTeams: Team[]
  existingTeamIds: string[]
}

const AVAILABLE_ROLES = ['PLAYER', 'COACH', 'TRAINER', 'ASSISTANT_COACH'] as const

export function AddUserToTeam({ 
  userEmail, 
  userName, 
  availableTeams,
  existingTeamIds 
}: AddUserToTeamProps) {
  const router = useRouter()
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('PLAYER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Filter out teams user is already a member of
  const teamsUserCanJoin = availableTeams.filter(
    team => !existingTeamIds.includes(team.id)
  )

  const handleAddToTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTeamId) {
      setError('Please select a team')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/team-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeamId,
          email: userEmail,
          name: userName || userEmail,
          role: selectedRole
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add user to team')
      }

      const selectedTeam = availableTeams.find(t => t.id === selectedTeamId)
      setSuccess(`Successfully added to ${selectedTeam?.name} as ${selectedRole.replace('_', ' ')}`)
      setSelectedTeamId('')
      setSelectedRole('PLAYER')
      
      // Refresh the page to show the new membership
      setTimeout(() => {
        router.refresh()
        setSuccess(null)
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (teamsUserCanJoin.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add to New Team</h3>
        <p className="text-sm text-gray-500 text-center py-4">
          User is already a member of all available teams
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add to New Team</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
          {success}
        </div>
      )}

      <form onSubmit={handleAddToTeam} className="space-y-4">
        {/* Team Selection */}
        <div>
          <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-2">
            Select Team
          </label>
          <select
            id="team"
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            required
          >
            <option value="">Choose a team...</option>
            {teamsUserCanJoin.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name} ({team.sport.name})
              </option>
            ))}
          </select>
        </div>

        {/* Role Selection */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            Select Role
          </label>
          <select
            id="role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            required
          >
            {AVAILABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {role.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !selectedTeamId}
          className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add to Team'}
        </button>
      </form>

      <p className="mt-4 text-xs text-gray-500">
        💡 After adding to a team, you can add additional roles using the "Team Memberships" section above
      </p>
    </div>
  )
}
