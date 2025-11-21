'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

interface Team {
  id: string
  name: string
}

interface AdminUserFiltersProps {
  teams: Team[]
}

export function AdminUserFilters({ teams }: AdminUserFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [role, setRole] = useState(searchParams.get('role') || '')
  const [teamId, setTeamId] = useState(searchParams.get('teamId') || '')

  const applyFilters = () => {
    const params = new URLSearchParams()
    
    if (search) params.set('search', search)
    if (role) params.set('role', role)
    if (teamId) params.set('teamId', teamId)
    
    const queryString = params.toString()
    router.push(`/admin/users${queryString ? `?${queryString}` : ''}`)
  }

  const clearFilters = () => {
    setSearch('')
    setRole('')
    setTeamId('')
    router.push('/admin/users')
  }

  const hasActiveFilters = search || role || teamId

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filter Users</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            placeholder="Name or email..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Role Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            User Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">👑 Admin</option>
            <option value="TRAINER">🏃 Trainer</option>
            <option value="PLAYER">👤 Player</option>
          </select>
        </div>

        {/* Team Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Team
          </label>
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Teams</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        {/* Apply Button */}
        <div className="flex items-end">
          <button
            onClick={applyFilters}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}
