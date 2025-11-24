'use client'

import { useState } from 'react'

export function DatabaseFixButton() {
  const [fixing, setFixing] = useState(false)
  const [forceFix, setForceFix] = useState(false)
  const [result, setResult] = useState<{type: 'success' | 'error', message: string, data?: any} | null>(null)

  const fixConstraint = async (force: boolean = false) => {
    setFixing(true)
    setResult(null)
    
    try {
      const endpoint = force ? '/api/force-fix-constraint' : '/api/fix-constraint'
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResult({ type: 'success', message: data.message, data })
      } else {
        setResult({ type: 'error', message: data.error, data })
      }
    } catch (error: any) {
      setResult({ type: 'error', message: 'Failed to connect: ' + error.message })
    } finally {
      setFixing(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">🔧 Database Maintenance</h2>
      <div className="space-y-4">
        <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-900 mb-1">
                Fix Multiple Roles Constraint
              </h3>
              <p className="text-xs text-yellow-800 mb-3">
                If you're seeing "Unique constraint failed on (teamId, userId)" when adding extra roles, 
                click this button to update the database constraint to allow multiple roles per user per team.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fixConstraint(false)}
                  disabled={fixing}
                  className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {fixing ? 'Running...' : 'Run Database Fix'}
                </button>
                <button
                  onClick={() => fixConstraint(true)}
                  disabled={fixing}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {fixing ? 'Running...' : 'FORCE Fix'}
                </button>
              </div>
              {result && (
                <div className={`mt-3 ${result.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-3`}>
                  <div className={`text-sm font-medium ${result.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                    {result.type === 'success' ? '✅' : '❌'} {result.message}
                  </div>
                  {result.data?.logs && (
                    <div className="mt-2 text-xs text-gray-600 font-mono bg-white rounded p-2 max-h-64 overflow-auto">
                      {result.data.logs.map((log: string, i: number) => (
                        <div key={i}>{log}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
