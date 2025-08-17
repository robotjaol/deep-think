'use client'

import { useState } from 'react'
import { Decision, Consequence } from '@/lib/types'

interface DecisionPanelProps {
  decisions: Decision[]
  selectedDecision: Decision | null
  onDecisionSelect: (decision: Decision) => void
  onDecisionSubmit: (decision: Decision) => void
  timePressure: number
  disabled: boolean
}

export function DecisionPanel({
  decisions,
  selectedDecision,
  onDecisionSelect,
  onDecisionSubmit,
  timePressure,
  disabled
}: DecisionPanelProps) {
  const [showConsequences, setShowConsequences] = useState<string | null>(null)

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'border-green-300 bg-green-50 hover:bg-green-100'
      case 'medium': return 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100'
      case 'high': return 'border-red-300 bg-red-50 hover:bg-red-100'
      default: return 'border-gray-300 bg-gray-50 hover:bg-gray-100'
    }
  }

  const getConsequenceTypeIcon = (type: string) => {
    return type === 'direct' ? '⚡' : '🔄'
  }

  const getImpactColor = (impact: number) => {
    if (impact > 0) return 'text-green-600'
    if (impact < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getPressureWarning = () => {
    if (timePressure > 0.8) return 'border-red-500 bg-red-50'
    if (timePressure > 0.6) return 'border-yellow-500 bg-yellow-50'
    return ''
  }

  return (
    <div className="p-6 h-full">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Your Decision</h2>
          {timePressure > 0.5 && (
            <div className="flex items-center text-sm text-red-600">
              <span className="animate-pulse mr-1">⏰</span>
              Time running out!
            </div>
          )}
        </div>

        {/* Decision Options */}
        <div className="space-y-3">
          {decisions.map((decision) => (
            <div key={decision.id} className="space-y-2">
              <div
                className={`
                  border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
                  ${selectedDecision?.id === decision.id 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : getRiskLevelColor(decision.riskLevel)
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  ${getPressureWarning()}
                `}
                onClick={() => !disabled && onDecisionSelect(decision)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium leading-relaxed">
                      {decision.text}
                    </p>
                    
                    <div className="flex items-center mt-2 space-x-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        decision.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                        decision.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {decision.riskLevel.toUpperCase()} RISK
                      </span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowConsequences(
                            showConsequences === decision.id ? null : decision.id
                          )
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                        disabled={disabled}
                      >
                        {showConsequences === decision.id ? 'Hide' : 'Preview'} Consequences
                      </button>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedDecision?.id === decision.id 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedDecision?.id === decision.id && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Consequence Preview */}
              {showConsequences === decision.id && (
                <div className="ml-4 bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Potential Consequences</h4>
                  <div className="space-y-2">
                    {decision.consequences.map((consequence, index) => (
                      <ConsequencePreview key={index} consequence={consequence} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        {selectedDecision && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => onDecisionSubmit(selectedDecision)}
              disabled={disabled}
              className={`
                w-full py-3 px-4 rounded-md font-medium transition-all duration-200
                ${disabled 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                }
                ${timePressure > 0.8 ? 'animate-pulse' : ''}
              `}
            >
              {disabled ? 'Session Paused' : 'Confirm Decision'}
            </button>
            
            {timePressure > 0.7 && (
              <p className="text-xs text-red-600 text-center mt-2">
                ⚠️ Decision will auto-submit when time expires
              </p>
            )}
          </div>
        )}

        {/* Decision Guidance */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">🎯 Decision Tips</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Consider both immediate and long-term impacts</li>
            <li>• Think about stakeholder reactions</li>
            <li>• Assess available resources and constraints</li>
            <li>• Trust your expertise but stay adaptable</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function ConsequencePreview({ consequence }: { consequence: Consequence }) {
  const getImpactColor = (impact: number) => {
    if (impact > 0) return 'text-green-600'
    if (impact < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getConsequenceTypeIcon = (type: string) => {
    return type === 'direct' ? '⚡' : '🔄'
  }

  return (
    <div className="flex items-start space-x-3 p-2 bg-white rounded border">
      <div className="flex-shrink-0 mt-0.5">
        <span className="text-sm">{getConsequenceTypeIcon(consequence.type)}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800">{consequence.description}</p>
        
        <div className="flex items-center mt-1 space-x-3">
          <span className={`text-xs font-medium ${getImpactColor(consequence.impact_score)}`}>
            Impact: {consequence.impact_score > 0 ? '+' : ''}{consequence.impact_score}
          </span>
          
          <span className="text-xs text-gray-500">
            Probability: {Math.round(consequence.probability * 100)}%
          </span>
          
          {consequence.delay_minutes && (
            <span className="text-xs text-gray-500">
              Delay: {consequence.delay_minutes}min
            </span>
          )}
        </div>
      </div>
    </div>
  )
}