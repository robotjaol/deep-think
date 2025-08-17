'use client'

import React, { useState, useEffect } from 'react'
import { DecisionTreeViz, OutcomeTimelineViz, RiskExposureChart } from './index'
import { ScenarioState, Decision, DecisionBranch, SessionDecision, ScoreResult } from '@/lib/types'

// Mock data for demonstration
const createMockData = () => {
  const mockDecisions: Decision[] = [
    {
      id: 'decision-1',
      text: 'Evacuate building immediately',
      consequences: [
        {
          id: 'consequence-1',
          type: 'direct',
          description: 'All personnel safely evacuated',
          impact_score: 50,
          probability: 0.9
        },
        {
          id: 'consequence-2',
          type: 'second-order',
          description: 'Business operations disrupted for 2 hours',
          impact_score: -20,
          delay_minutes: 15,
          probability: 0.7
        }
      ],
      nextStateId: 'state-2',
      riskLevel: 'medium' as const
    },
    {
      id: 'decision-2',
      text: 'Investigate alarm source first',
      consequences: [
        {
          id: 'consequence-3',
          type: 'direct',
          description: 'Potential delay in evacuation',
          impact_score: -30,
          probability: 0.6
        }
      ],
      nextStateId: 'state-3',
      riskLevel: 'high' as const
    },
    {
      id: 'decision-3',
      text: 'Contact security team',
      consequences: [
        {
          id: 'consequence-4',
          type: 'direct',
          description: 'Security assessment initiated',
          impact_score: 25,
          probability: 0.8
        }
      ],
      nextStateId: 'state-4',
      riskLevel: 'low' as const
    }
  ]

  const mockScenarioState: ScenarioState = {
    id: 'state-1',
    description: 'Fire alarm has been triggered in the main building. Smoke is visible on the third floor.',
    context: 'Emergency situation requiring immediate decision-making. 200 employees are currently in the building.',
    decisions: mockDecisions,
    timeLimit: 300,
    environmentalFactors: ['smoke', 'heat', 'alarm_sound'],
    characters: [
      {
        id: 'char-1',
        name: 'Sarah Johnson',
        role: 'Safety Officer',
        personality_traits: ['calm', 'decisive'],
        communication_style: 'direct',
        expertise_areas: ['emergency_response', 'evacuation_procedures']
      }
    ],
    riskLevel: 'high',
    criticalityScore: 85
  }

  const mockBranches: DecisionBranch[] = [
    {
      fromStateId: 'state-1',
      decisionId: 'decision-1',
      toStateId: 'state-2',
      transitionEffects: ['evacuation_initiated', 'alarm_acknowledged']
    },
    {
      fromStateId: 'state-1',
      decisionId: 'decision-2',
      toStateId: 'state-3',
      transitionEffects: ['investigation_started']
    },
    {
      fromStateId: 'state-1',
      decisionId: 'decision-3',
      toStateId: 'state-4',
      transitionEffects: ['security_contacted']
    }
  ]

  const mockSessionDecisions: SessionDecision[] = [
    {
      id: 'session-decision-1',
      session_id: 'session-1',
      state_id: 'state-1',
      decision_text: 'Evacuate building immediately',
      timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      time_taken_ms: 8000,
      score_impact: 50,
      consequences: [
        {
          id: 'consequence-1',
          type: 'direct',
          description: 'All personnel safely evacuated',
          impact_score: 50,
          delay_minutes: 2,
          probability: 0.9
        },
        {
          id: 'consequence-2',
          type: 'second-order',
          description: 'Business operations disrupted',
          impact_score: -20,
          delay_minutes: 15,
          probability: 0.7
        }
      ]
    },
    {
      id: 'session-decision-2',
      session_id: 'session-1',
      state_id: 'state-2',
      decision_text: 'Contact emergency services',
      timestamp: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
      time_taken_ms: 5000,
      score_impact: 75,
      consequences: [
        {
          id: 'consequence-3',
          type: 'direct',
          description: 'Fire department dispatched',
          impact_score: 75,
          delay_minutes: 5,
          probability: 0.95
        }
      ]
    }
  ]

  const mockRiskMetrics = [
    {
      category: 'Safety',
      currentLevel: 75,
      maxLevel: 100,
      trend: 'decreasing' as const,
      color: '#ef4444',
      description: 'Personnel safety risk'
    },
    {
      category: 'Financial',
      currentLevel: 45,
      maxLevel: 100,
      trend: 'increasing' as const,
      color: '#f59e0b',
      description: 'Financial impact risk'
    },
    {
      category: 'Operational',
      currentLevel: 60,
      maxLevel: 100,
      trend: 'stable' as const,
      color: '#8b5cf6',
      description: 'Business continuity risk'
    },
    {
      category: 'Reputation',
      currentLevel: 30,
      maxLevel: 100,
      trend: 'decreasing' as const,
      color: '#06b6d4',
      description: 'Brand reputation risk'
    }
  ]

  const mockRiskHistory = Array.from({ length: 10 }, (_, i) => ({
    timestamp: new Date(Date.now() - (9 - i) * 60000), // Every minute for last 10 minutes
    overallRisk: 30 + Math.sin(i * 0.5) * 20 + Math.random() * 10,
    financialRisk: 25 + Math.cos(i * 0.3) * 15 + Math.random() * 8,
    operationalRisk: 40 + Math.sin(i * 0.7) * 25 + Math.random() * 12,
    reputationalRisk: 20 + Math.cos(i * 0.4) * 18 + Math.random() * 6,
    complianceRisk: 35 + Math.sin(i * 0.6) * 20 + Math.random() * 10
  }))

  const mockScoreResult: ScoreResult = {
    totalScore: 78,
    directImpact: 85,
    secondOrderEffects: 65,
    riskManagement: 82,
    timeEfficiency: 70,
    breakdown: [
      {
        category: 'Decision Speed',
        score: 70,
        maxScore: 100,
        explanation: 'Good response time under pressure',
        improvementSuggestions: ['Practice rapid decision-making scenarios']
      },
      {
        category: 'Risk Assessment',
        score: 82,
        maxScore: 100,
        explanation: 'Excellent risk evaluation skills',
        improvementSuggestions: ['Continue developing situational awareness']
      }
    ]
  }

  return {
    mockScenarioState,
    mockBranches,
    mockSessionDecisions,
    mockRiskMetrics,
    mockRiskHistory,
    mockScoreResult
  }
}

export const VisualizationDemo: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<'tree' | 'timeline' | 'risk'>('tree')
  const [isLive, setIsLive] = useState(false)
  
  const {
    mockScenarioState,
    mockBranches,
    mockSessionDecisions,
    mockRiskMetrics,
    mockRiskHistory,
    mockScoreResult
  } = createMockData()

  // Simulate live updates for risk chart
  const [liveRiskHistory, setLiveRiskHistory] = useState(mockRiskHistory)
  const [liveRiskMetrics, setLiveRiskMetrics] = useState(mockRiskMetrics)

  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      // Add new risk data point
      setLiveRiskHistory(prev => {
        const newPoint = {
          timestamp: new Date(),
          overallRisk: Math.max(0, Math.min(100, prev[prev.length - 1].overallRisk + (Math.random() - 0.5) * 10)),
          financialRisk: Math.max(0, Math.min(100, prev[prev.length - 1].financialRisk + (Math.random() - 0.5) * 8)),
          operationalRisk: Math.max(0, Math.min(100, prev[prev.length - 1].operationalRisk + (Math.random() - 0.5) * 12)),
          reputationalRisk: Math.max(0, Math.min(100, prev[prev.length - 1].reputationalRisk + (Math.random() - 0.5) * 6)),
          complianceRisk: Math.max(0, Math.min(100, prev[prev.length - 1].complianceRisk + (Math.random() - 0.5) * 10))
        }
        return [...prev.slice(-20), newPoint] // Keep last 20 points
      })

      // Update risk metrics
      setLiveRiskMetrics(prev => prev.map(metric => ({
        ...metric,
        currentLevel: Math.max(0, Math.min(100, metric.currentLevel + (Math.random() - 0.5) * 5)),
        trend: Math.random() > 0.7 ? 
          (Math.random() > 0.5 ? 'increasing' as const : 'decreasing' as const) : 
          metric.trend
      })))
    }, 2000)

    return () => clearInterval(interval)
  }, [isLive])

  const handleNodeClick = (node: any) => {
    console.log('Node clicked:', node)
    // In a real app, this might navigate to a different state or show details
  }

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Deep-Think Visualization Components
        </h1>
        <p className="text-gray-600 mb-6">
          Interactive D3.js visualizations for crisis decision training
        </p>
        
        {/* Demo selector */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setSelectedDemo('tree')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedDemo === 'tree'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Decision Tree
          </button>
          <button
            onClick={() => setSelectedDemo('timeline')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedDemo === 'timeline'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Outcome Timeline
          </button>
          <button
            onClick={() => setSelectedDemo('risk')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedDemo === 'risk'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Risk Exposure
          </button>
        </div>

        {/* Live demo toggle for risk chart */}
        {selectedDemo === 'risk' && (
          <div className="flex justify-center mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isLive}
                onChange={(e) => setIsLive(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Enable live updates</span>
            </label>
          </div>
        )}
      </div>

      {/* Visualization display */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {selectedDemo === 'tree' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Decision Tree Visualization</h2>
            <p className="text-gray-600 mb-6">
              Interactive tree showing decision paths and their outcomes. Click and drag nodes to explore.
            </p>
            <DecisionTreeViz
              currentState={mockScenarioState}
              availableStates={{ 
                'state-1': mockScenarioState,
                'state-2': { ...mockScenarioState, id: 'state-2', description: 'Evacuation in progress...' },
                'state-3': { ...mockScenarioState, id: 'state-3', description: 'Investigation underway...' },
                'state-4': { ...mockScenarioState, id: 'state-4', description: 'Security team contacted...' }
              }}
              branches={mockBranches}
              completedDecisions={['decision-1']}
              currentDecisionPath={['state-1', 'state-2']}
              onNodeClick={handleNodeClick}
              className="w-full"
              width={800}
              height={500}
            />
          </div>
        )}

        {selectedDemo === 'timeline' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Outcome Timeline Visualization</h2>
            <p className="text-gray-600 mb-6">
              Timeline showing decisions and their consequences over time. Hover over events for details.
            </p>
            <OutcomeTimelineViz
              decisions={mockSessionDecisions}
              startTime={new Date(Date.now() - 600000)} // 10 minutes ago
              currentTime={new Date()}
              className="w-full"
              width={800}
              height={400}
              showFutureEvents={true}
            />
          </div>
        )}

        {selectedDemo === 'risk' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Risk Exposure Chart</h2>
            <p className="text-gray-600 mb-6">
              Real-time risk monitoring with gauge and timeline views. Toggle between views and enable live updates.
            </p>
            <RiskExposureChart
              currentRiskMetrics={liveRiskMetrics}
              riskHistory={liveRiskHistory}
              decisions={mockSessionDecisions}
              scoreResult={mockScoreResult}
              className="w-full"
              width={800}
              height={500}
              showRealTime={isLive}
            />
          </div>
        )}
      </div>

      {/* Feature highlights */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Interactive Elements</h3>
          <p className="text-blue-700 text-sm">
            All visualizations support mouse interactions, zooming, and responsive design for mobile and desktop.
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">Real-time Updates</h3>
          <p className="text-green-700 text-sm">
            Charts update dynamically as decisions are made and consequences unfold during training scenarios.
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-900 mb-2">Accessibility</h3>
          <p className="text-purple-700 text-sm">
            Built with accessibility in mind, including keyboard navigation and screen reader support.
          </p>
        </div>
      </div>

      {/* Technical details */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">Technical Implementation</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium mb-2">Technologies Used:</h4>
            <ul className="space-y-1">
              <li>• D3.js for data visualization</li>
              <li>• React with TypeScript</li>
              <li>• Tailwind CSS for styling</li>
              <li>• Responsive design patterns</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Features:</h4>
            <ul className="space-y-1">
              <li>• Force-directed graph layouts</li>
              <li>• Interactive timelines</li>
              <li>• Real-time data updates</li>
              <li>• Mobile-optimized interactions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VisualizationDemo