'use client'

import { ScenarioState, Decision } from '@/lib/types'

interface VisualizationPanelProps {
  stateHistory: string[]
  decisionHistory: Decision[]
  currentState: ScenarioState
  timePressure: number
}

export function VisualizationPanel({ 
  stateHistory, 
  decisionHistory, 
  currentState, 
  timePressure 
}: VisualizationPanelProps) {
  const calculateAverageImpact = () => {
    if (decisionHistory.length === 0) return 0
    
    const totalImpact = decisionHistory.reduce((sum, decision) => {
      return sum + decision.consequences.reduce((impactSum, consequence) => {
        return impactSum + consequence.impact_score
      }, 0)
    }, 0)
    
    return totalImpact / decisionHistory.length
  }

  const getRiskTrend = () => {
    if (decisionHistory.length < 2) return 'stable'
    
    const recentDecisions = decisionHistory.slice(-3)
    const riskLevels = recentDecisions.map(d => {
      switch (d.riskLevel) {
        case 'low': return 1
        case 'medium': return 2
        case 'high': return 3
        default: return 2
      }
    })
    
    const trend = riskLevels[riskLevels.length - 1] - riskLevels[0]
    if (trend > 0) return 'increasing'
    if (trend < 0) return 'decreasing'
    return 'stable'
  }

  const averageImpact = calculateAverageImpact()
  const riskTrend = getRiskTrend()

  return (
    <div className="p-6 h-full">
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900">Analytics</h2>

        {/* Decision Path Visualization */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Decision Path</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-3">
              {decisionHistory.map((decision, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{decision.text}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        decision.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                        decision.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {decision.riskLevel}
                      </span>
                      
                      <span className="text-xs text-gray-500">
                        Impact: {decision.consequences.reduce((sum, c) => sum + c.impact_score, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {decisionHistory.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p>No decisions made yet</p>
                  <p className="text-sm">Your decision path will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance</h3>
          <div className="grid grid-cols-1 gap-4">
            {/* Average Impact */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Average Impact</span>
                <span className={`text-lg font-bold ${
                  averageImpact > 0 ? 'text-green-600' : 
                  averageImpact < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {averageImpact > 0 ? '+' : ''}{averageImpact.toFixed(1)}
                </span>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      averageImpact > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.abs(averageImpact) * 10)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Risk Trend */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Risk Trend</span>
                <span className={`text-sm font-medium flex items-center ${
                  riskTrend === 'increasing' ? 'text-red-600' :
                  riskTrend === 'decreasing' ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {riskTrend === 'increasing' && '↗️ Increasing'}
                  {riskTrend === 'decreasing' && '↘️ Decreasing'}
                  {riskTrend === 'stable' && '➡️ Stable'}
                </span>
              </div>
            </div>

            {/* Current Pressure */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Time Pressure</span>
                <span className={`text-sm font-medium ${
                  timePressure > 0.7 ? 'text-red-600' :
                  timePressure > 0.4 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {Math.round(timePressure * 100)}%
                </span>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      timePressure > 0.7 ? 'bg-red-500' :
                      timePressure > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${timePressure * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decision Insights */}
        {decisionHistory.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Insights</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Total Decisions:</span>
                  <span className="font-medium text-blue-900">{decisionHistory.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">High Risk Decisions:</span>
                  <span className="font-medium text-blue-900">
                    {decisionHistory.filter(d => d.riskLevel === 'high').length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">States Visited:</span>
                  <span className="font-medium text-blue-900">{stateHistory.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for future D3.js visualizations */}
        <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="text-gray-500">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm">Advanced visualizations</p>
            <p className="text-xs">Decision trees and outcome charts will appear here</p>
          </div>
        </div>
      </div>
    </div>
  )
}