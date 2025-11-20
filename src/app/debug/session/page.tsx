"use client"

import { useEffect, useState } from "react"

export default function SessionDebugPage() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        setSession(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching session:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Session Debug</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Status</h2>
          {session?.user ? (
            <div className="space-y-2">
              <p className="text-green-600 font-semibold">✅ Logged In</p>
              <div className="bg-gray-50 p-4 rounded">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-red-600 font-semibold mb-4">❌ Not Logged In</p>
              <a 
                href="/login" 
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Go to Login
              </a>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>If not logged in, click the "Go to Login" button above</li>
            <li>If logged in, check that the user ID matches: <code className="bg-gray-100 px-2 py-1 rounded">cmi7nluj40008q43wx4l6u2qi</code></li>
            <li>After verifying login, go to <a href="/teams" className="text-blue-600 hover:underline">/teams</a></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
