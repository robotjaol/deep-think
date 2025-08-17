'use client'

import { ScenarioState, Decision } from '@/lib/types'

interface ProgressTrackerProps {
  stateHistory: string[]
  decisionHistory: Decision[]
  currentState: ScenarioState
}

export function ProgressTracker({ stateHistory, decisionHistory, currentState }: ProgressTrackerProps) {
  const totalSteps = stateHistory.length
  const currentStep = totalSteps
  const isTerminal = currentState.decisions.length === 0

  const getStepStatus = (index: number) => {
    if (index < currentStep - 1) return 'completed'
    if (index === currentStep - 1) return 'current'
    return 'upcoming'
  }

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 border-green-500'
      case 'current': return 'bg-blue-500 border-blue-500'
      case 'upcoming': return 'bg-gray-300 border-gray-300'
      default: return 'bg-gray-300 border-gray-300'
    }
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Progress Steps */}
      <div className="flex items-center space-x-2">
        {Array.from({ length: Math.min(totalSteps, 8) }, (_, index) => {
          const status = getStepStatus(index)
          return (
            <div key={index} className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${getStepColor(status)}`}
              >
                {status === 'completed' && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full" />
                  </div>
                )}
              </div>
              
              {index < Math.min(totalSteps, 8) - 1 && (
                <div className={`w-4 h-0.5 mx-1 ${
                  status === 'completed' ? 'bg-green-300' : 'bg-gray-300'
                }`} />
              )}
            </div>
          )
        })}
        
        {totalSteps > 8 && (
          <div className="text-sm text-gray-500 ml-2">
            +{totalSteps - 8} more
          </div>
        )}
      </div>

      {/* Progress Info */}
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-1">
          <span className="text-gray-600">Step:</span>
          <span className="font-medium text-gray-900">{currentStep}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <span className="text-gray-600">Decisions:</span>
          <span className="font-medium text-gray-900">{decisionHistory.length}</span>
        </div>

        <div className="flex items-center space-x-1">
          <span className="text-gray-600">Risk:</span>
          <span className={`font-medium px-2 py-0.5 rounded text-xs ${
            currentState.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
            currentState.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {currentState.riskLevel.toUpperCase()}
          </span>
        </div>

        {isTerminal && (
          <div className="flex items-center space-x-1">
            <span className="text-green-600 font-medium">✓ Complete</span>
          </div>
        )}
      </div>
    </div>
  )
}