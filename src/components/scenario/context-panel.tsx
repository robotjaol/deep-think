'use client'

import { ScenarioState, Character } from '@/lib/types'

interface DecisionContext {
  currentRiskLevel: string
  criticalityScore: number
  environmentalFactors: string[]
  availableCharacters: Character[]
  timeRemaining?: number
}

interface ContextPanelProps {
  state: ScenarioState
  context: DecisionContext
  timePressure: number
}

export function ContextPanel({ state, context, timePressure }: ContextPanelProps) {
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPressureColor = (pressure: number) => {
    if (pressure < 0.3) return 'bg-green-500'
    if (pressure < 0.7) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="p-6 h-full">
      <div className="space-y-6">
        {/* Scenario Description */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Current Situation</h2>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md">
            <p className="text-gray-800 leading-relaxed">{state.description}</p>
          </div>
        </div>

        {/* Context Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Context</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-gray-700 leading-relaxed">{state.context}</p>
          </div>
        </div>

        {/* Risk and Criticality Indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Risk Level</h4>
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(context.currentRiskLevel)}`}>
              {context.currentRiskLevel.toUpperCase()}
            </span>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Criticality</h4>
            <div className="flex items-center">
              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, context.criticalityScore)}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-600">
                {Math.round(context.criticalityScore)}%
              </span>
            </div>
          </div>
        </div>

        {/* Time Pressure Indicator */}
        {state.timeLimit && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Time Pressure</h4>
            <div className="flex items-center">
              <div className="flex-1 bg-gray-200 rounded-full h-3 mr-2">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${getPressureColor(timePressure)}`}
                  style={{ width: `${Math.min(100, timePressure * 100)}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-600">
                {Math.round(timePressure * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Environmental Factors */}
        {context.environmentalFactors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Environmental Factors</h4>
            <div className="space-y-2">
              {context.environmentalFactors.map((factor, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <p className="text-sm text-gray-600">{factor}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Characters */}
        {context.availableCharacters.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Key Personnel</h4>
            <div className="space-y-3">
              {context.availableCharacters.map((character) => (
                <div key={character.id} className="bg-white border border-gray-200 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{character.name}</h5>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {character.role}
                    </span>
                  </div>
                  
                  {character.expertise_areas.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-600 mb-1">Expertise:</p>
                      <div className="flex flex-wrap gap-1">
                        {character.expertise_areas.map((area, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Style:</span> {character.communication_style}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Context Hints */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">💡 Consider</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• What are the immediate vs. long-term consequences?</li>
            <li>• Who are the key stakeholders affected?</li>
            <li>• What resources are available to you?</li>
            <li>• How might this decision cascade to other areas?</li>
          </ul>
        </div>
      </div>
    </div>
  )
}