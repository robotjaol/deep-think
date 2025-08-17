'use client'

import { useState, useEffect } from 'react'

interface DecisionTimerProps {
  timeLimit: number // in seconds
  timePressure: number // 0-1
  isActive: boolean
  onTimeout: () => void
}

export function DecisionTimer({ timeLimit, timePressure, isActive, onTimeout }: DecisionTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit)

  useEffect(() => {
    const remaining = Math.max(0, timeLimit * (1 - timePressure))
    setTimeRemaining(remaining)

    if (isActive && remaining <= 0 && timePressure >= 1) {
      onTimeout()
    }
  }, [timeLimit, timePressure, isActive, onTimeout])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerColor = () => {
    if (timePressure > 0.8) return 'text-red-600'
    if (timePressure > 0.6) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getProgressColor = () => {
    if (timePressure > 0.8) return 'bg-red-500'
    if (timePressure > 0.6) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <div className={`text-lg font-mono font-bold ${getTimerColor()}`}>
          {formatTime(timeRemaining)}
        </div>
        
        {timePressure > 0.8 && (
          <div className="animate-pulse text-red-500">
            ⚠️
          </div>
        )}
      </div>

      <div className="w-24 bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${Math.max(0, (1 - timePressure) * 100)}%` }}
        />
      </div>

      {!isActive && (
        <div className="text-sm text-gray-500">
          Paused
        </div>
      )}
    </div>
  )
}