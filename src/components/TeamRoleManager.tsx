'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface TeamMembership {
  id: string
  role: string
  team: {
    id: string
    name: string
    sport: { name: string }
  }
}

interface TeamRoleManagerProps {
  userId: string
  memberships: TeamMembership[]
}

const AVAILABLE_ROLES = ['PLAYER', 'COACH', 'TRAINER', 'ASSISTANT_COACH'] as const

export function TeamRoleManager({ userId, memberships }: TeamRoleManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Group memberships by team
  const groupedMemberships = memberships.reduce((acc, membership) => {
    const teamId = membership.team.id
    if (!acc[teamId]) {
      acc[teamId] = {
        team: membership.team,
        roles: []
      }
    }
    acc[teamId].roles.push({
      id: membership.id,
      role: membership.role
    })
    return acc
  }, {} as Record<string, { team: any; roles: { id: string; role: string }[] }>)

  const handleAddRole = async (teamId: string, role: string) => {
    setLoading(`${teamId}-${role}`)
    setError(null)

    try {
      const response = await fetch('/api/team-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          userId,
          role
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add role')
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(null)
    }
  }

  const handleRemoveRole = async (membershipId: string) => {
    if (!confirm('Are you sure you want to remove this role?')) {
      return
    }

    setLoading(membershipId)
    setError(null)

    try {
      const response = await fetch(`/api/team-members/${membershipId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove role')
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Memberships</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {Object.values(groupedMemberships).map((group) => (
          <div key={group.team.id} className="border rounded-lg p-4">
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-900">{group.team.name}</p>
              <p className="text-xs text-gray-500">{group.team.sport.name}</p>
            </div>

            {/* Current Roles */}
            <div className="space-y-2 mb-3">
              {group.roles.map((roleItem) => (
                <div
                  key={roleItem.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    roleItem.role === 'COACH' ? 'bg-purple-100 text-purple-800' :
                    roleItem.role === 'TRAINER' ? 'bg-orange-100 text-orange-800' :
                    roleItem.role === 'ASSISTANT_COACH' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {roleItem.role.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => handleRemoveRole(roleItem.id)}
                    disabled={loading === roleItem.id}
                    className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    {loading === roleItem.id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>

            {/* Add Role Dropdown */}
            <div className="pt-2 border-t">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddRole(group.team.id, e.target.value)
                    e.target.value = ''
                  }
                }}
                disabled={loading?.startsWith(group.team.id)}
                className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">+ Add another role...</option>
                {AVAILABLE_ROLES.filter(
                  role => !group.roles.some(r => r.role === role)
                ).map(role => (
                  <option key={role} value={role}>
                    {role.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}

        {Object.keys(groupedMemberships).length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            User is not a member of any teams
          </p>
        )}
      </div>
    </div>
  )
}
