'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import Link from 'next/link'

interface ScheduledTraining {
  id: string
  teamId: string
  workoutId: string | null
  title: string
  description: string | null
  scheduledAt: string
  duration: number | null
  location: string | null
  status: string
  workout: {
    id: string
    title: string
  } | null
  attendanceSummary: {
    total: number
    present: number
    absent: number
    late: number
    excused: number
    pending: number
  }
}

interface TrainingCalendarProps {
  trainings: ScheduledTraining[]
  teamId: string
  onScheduleTraining: () => void
}

export default function TrainingCalendar({ trainings, teamId, onScheduleTraining }: TrainingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [showAllTrainings, setShowAllTrainings] = useState(false)

  // Get trainings for current month
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthTrainings = trainings.filter(training => {
    const trainingDate = new Date(training.scheduledAt)
    return trainingDate >= monthStart && trainingDate <= monthEnd
  })

  // Calendar grid
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Get trainings for a specific day
  const getTrainingsForDay = (day: Date) => {
    return trainings.filter(training => 
      isSameDay(new Date(training.scheduledAt), day)
    )
  }

  // Get upcoming trainings for list view
  const upcomingTrainings = trainings
    .filter(training => new Date(training.scheduledAt) >= new Date())
    .slice(0, showAllTrainings ? undefined : 5)

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">📅 Scheduled Trainings</h2>
          
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition ${
                viewMode === 'calendar' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📅 Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition ${
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 List
            </button>
          </div>
        </div>
        
        <button
          onClick={onScheduleTraining}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
        >
          + Schedule Training
        </button>
      </div>

      {trainings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg mb-2">No scheduled trainings yet</p>
          <p className="text-sm text-gray-400 mb-4">Schedule a training to track attendance</p>
          <button
            onClick={onScheduleTraining}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Schedule First Training
          </button>
        </div>
      ) : (
        <>
          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <div>
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={previousMonth}
                  className="p-2 text-gray-400 hover:text-gray-600 transition"
                >
                  ←
                </button>
                <h3 className="text-lg font-semibold text-gray-900">
                  {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <button
                  onClick={nextMonth}
                  className="p-2 text-gray-400 hover:text-gray-600 transition"
                >
                  →
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-3 text-center text-xs font-medium text-gray-500 bg-gray-50">
                    {day}
                  </div>
                ))}
                
                {/* Calendar Days */}
                {days.map(day => {
                  const dayTrainings = getTrainingsForDay(day)
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isToday = isSameDay(day, new Date())
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[80px] p-2 border border-gray-100 ${
                        isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                      } ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                      } ${isToday ? 'text-blue-600' : ''}`}>
                        {format(day, 'd')}
                      </div>
                      
                      {/* Training Indicators */}
                      <div className="space-y-1">
                        {dayTrainings.slice(0, 2).map(training => {
                          const isPast = new Date(training.scheduledAt) < new Date()
                          
                          return (
                            <Link
                              key={training.id}
                              href={`/teams/${teamId}/trainings/${training.id}`}
                              className={`block px-2 py-1 text-xs rounded truncate transition ${
                                training.status === 'COMPLETED' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                training.status === 'CANCELLED' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                                isPast ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                                'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                              title={`${training.title} - ${format(new Date(training.scheduledAt), 'h:mm a')}`}
                            >
                              {format(new Date(training.scheduledAt), 'h:mm')} {training.title}
                            </Link>
                          )
                        })}
                        
                        {dayTrainings.length > 2 && (
                          <div className="text-xs text-gray-500 px-2">
                            +{dayTrainings.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Calendar Legend */}
              <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-100 rounded"></div>
                  <span>Scheduled</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-100 rounded"></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-100 rounded"></div>
                  <span>Needs Review</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-100 rounded"></div>
                  <span>Cancelled</span>
                </div>
              </div>
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div>
              <div className="space-y-3">
                {upcomingTrainings.map((training) => {
                  const isPast = new Date(training.scheduledAt) < new Date()
                  const isToday = new Date(training.scheduledAt).toDateString() === new Date().toDateString()
                  
                  return (
                    <Link
                      key={training.id}
                      href={`/teams/${teamId}/trainings/${training.id}`}
                      className="block p-4 rounded-lg border hover:border-blue-300 hover:shadow-sm transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{training.title}</h3>
                            {isToday && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                Today
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {format(new Date(training.scheduledAt), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                          </p>
                          {training.location && (
                            <p className="text-xs text-gray-500 mt-1">📍 {training.location}</p>
                          )}
                          {training.workout && (
                            <p className="text-xs text-blue-600 mt-1">
                              Based on: {training.workout.title}
                            </p>
                          )}
                          
                          {/* Attendance Summary */}
                          <div className="flex gap-4 mt-3 text-sm">
                            <span className="text-gray-600">
                              👥 {training.attendanceSummary.total} members
                            </span>
                            {isPast ? (
                              <>
                                <span className="text-green-600">
                                  ✓ {training.attendanceSummary.present} present
                                </span>
                                {training.attendanceSummary.absent > 0 && (
                                  <span className="text-red-600">
                                    ✗ {training.attendanceSummary.absent} absent
                                  </span>
                                )}
                                {training.attendanceSummary.late > 0 && (
                                  <span className="text-yellow-600">
                                    ⏰ {training.attendanceSummary.late} late
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-500">
                                ⏱ {training.attendanceSummary.pending} pending
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                          training.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          training.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          isPast ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {training.status === 'SCHEDULED' && isPast ? 'NEEDS REVIEW' : training.status}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
              
              {/* Show More Button */}
              {trainings.filter(t => new Date(t.scheduledAt) >= new Date()).length > 5 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowAllTrainings(!showAllTrainings)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                  >
                    {showAllTrainings ? '← Show Less' : `Show All ${trainings.filter(t => new Date(t.scheduledAt) >= new Date()).length} Trainings →`}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}