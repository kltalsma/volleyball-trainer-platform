import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { signOut } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Fetch real counts and data with contextual breakdown
  const [
    myExerciseCount,
    publicExerciseCount,
    myTrainingCount,
    teamTrainingCount,
    myTeamCount,
    totalUserCount,
    myTeams,
    upcomingTrainings,
    recentActivity
  ] = await Promise.all([
    // Exercise stats
    prisma.exercise.count({
      where: { creatorId: session.user.id }
    }),
    prisma.exercise.count({
      where: { 
        isPublic: true,
        creatorId: { not: session.user.id }
      }
    }),
    // Training stats
    prisma.workout.count({
      where: { creatorId: session.user.id }
    }),
    prisma.workout.count({
      where: {
        AND: [
          { creatorId: { not: session.user.id } },
          {
            OR: [
              { isPublic: true },
              {
                team: {
                  members: {
                    some: {
                      userId: session.user.id
                    }
                  }
                }
              }
            ]
          }
        ]
      }
    }),
    // Team stats
    prisma.team.count({
      where: {
        members: {
          some: {
            userId: session.user.id
          }
        }
      }
    }),
    // Total community users
    prisma.user.count(),
    // My teams
    prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        sport: true,
        _count: {
          select: {
            members: true,
            workouts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    }),
    // Recent & upcoming trainings (unscheduled, or within 2 hours to future)
    prisma.workout.findMany({
      where: {
        AND: [
          {
            OR: [
              { creatorId: session.user.id },
              {
                team: {
                  members: {
                    some: {
                      userId: session.user.id
                    }
                  }
                }
              }
            ]
          },
          {
            OR: [
              { startTime: null },
              { 
                startTime: { 
                  gte: new Date(Date.now() - 2 * 60 * 60 * 1000) // Show trainings from 2 hours ago or future
                }
              }
            ]
          }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        team: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            exercises: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      take: 5
    }),
    // Recent activity (your workouts and team workouts)
    prisma.workout.findMany({
      where: {
        OR: [
          { creatorId: session.user.id },
          {
            team: {
              members: {
                some: {
                  userId: session.user.id
                }
              }
            }
          }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        team: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Volleyball Trainer Platform
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {session.user.name || session.user.email}!
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/account"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ⚙️ Account
              </a>
              <form
                action={async () => {
                  "use server"
                  await signOut({ redirectTo: "/" })
                }}
              >
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="bg-gray-50 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8 py-3">
              <a
                href="/dashboard"
                className="px-3 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600"
              >
                Dashboard
              </a>
              <a
                href="/teams"
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300 transition-colors"
              >
                👥 Teams
              </a>
              <a
                href="/trainings"
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300 transition-colors"
              >
                📋 Trainings
              </a>
              <a
                href="/exercises"
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300 transition-colors"
              >
                🏐 Exercises
              </a>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats - Contextual with Community */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Exercises */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">🏐 Exercises Available</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {myExerciseCount + publicExerciseCount}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {myExerciseCount > 0 && <span className="text-blue-600 font-medium">{myExerciseCount} yours</span>}
                  {myExerciseCount > 0 && publicExerciseCount > 0 && <span className="text-gray-400"> • </span>}
                  {publicExerciseCount > 0 && <span>{publicExerciseCount} public</span>}
                  {myExerciseCount === 0 && publicExerciseCount === 0 && <span>Get started by creating exercises</span>}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Trainings */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">📋 Training Plans</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {myTrainingCount + teamTrainingCount}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {myTrainingCount > 0 && <span className="text-green-600 font-medium">{myTrainingCount} yours</span>}
                  {myTrainingCount > 0 && teamTrainingCount > 0 && <span className="text-gray-400"> • </span>}
                  {teamTrainingCount > 0 && <span>{teamTrainingCount} team</span>}
                  {myTrainingCount === 0 && teamTrainingCount === 0 && <span>Create your first training</span>}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Teams with Community Context */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">👥 My Teams</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {myTeamCount}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {totalUserCount > 1 && (
                    <span>Join <span className="text-purple-600 font-medium">{totalUserCount}</span> coaches</span>
                  )}
                  {totalUserCount === 1 && <span>You're the first coach!</span>}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <a href="/teams/new" className="flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Team
            </a>
            <a href="/exercises" className="flex items-center justify-center px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors border border-green-200">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Manage Exercises
            </a>
            <a href="/trainings/new" className="flex items-center justify-center px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule Training
            </a>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Teams */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">👥 My Teams</h2>
              <a href="/teams" className="text-sm text-blue-600 hover:text-blue-700">View all →</a>
            </div>
            {myTeams.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No teams yet</p>
                <a href="/teams/new" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">
                  Create your first team
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {myTeams.map((team) => (
                  <a
                    key={team.id}
                    href={`/teams/${team.id}`}
                    className="block p-4 rounded-lg border hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{team.name}</h3>
                        {team.sport && (
                          <p className="text-sm text-gray-600 mt-1">{team.sport.name}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>{team._count.members} members</span>
                          <span>{team._count.workouts} trainings</span>
                        </div>
                      </div>
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Trainings */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">📅 Recent & Upcoming Trainings</h2>
              <a href="/trainings" className="text-sm text-blue-600 hover:text-blue-700">View all →</a>
            </div>
            {upcomingTrainings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No upcoming trainings scheduled</p>
                <a href="/trainings/new" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">
                  Schedule a training
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTrainings.map((training) => (
                  <a
                    key={training.id}
                    href={`/trainings/${training.id}`}
                    className="block p-4 rounded-lg border hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{training.title}</h3>
                        {training.team && (
                          <p className="text-sm text-gray-600 mt-1">Team: {training.team.name}</p>
                        )}
                        {training.startTime && (
                          <p className="text-xs text-blue-600 mt-2">
                            {new Date(training.startTime).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {training._count.exercises} exercises
                          {training.totalDuration && ` • ${training.totalDuration} min`}
                        </p>
                      </div>
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a team or adding exercises</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.creator.name || activity.creator.email}</span>
                      {' '}created training{' '}
                      <a href={`/trainings/${activity.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                        {activity.title}
                      </a>
                      {activity.team && (
                        <>
                          {' '}for team{' '}
                          <a href={`/teams/${activity.team.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                            {activity.team.name}
                          </a>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
