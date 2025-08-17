import React from 'react'
import { render, screen } from '@testing-library/react'
import { VisualizationPanel } from '../visualization-panel'
import { ScenarioState, Decision } from '@/lib/types'

const mockCurrentState: ScenarioState = {
  id: 'test-state-1',
  description: 'Test scenario description',
  context: 'Test scenario context',
  decisions: [],
  timeLimit: 60,
  environmentalFactors: [],
  characters: [],
  riskLevel: 'medium',
  criticalityScore: 75
}

const mockDecisionHistory: Decision[] = [
  {
    id: 'decision-1',
    text: 'Made first decision',
    riskLevel: 'low',
    nextStateId: 'state-2',
    consequences: [
      {
        id: 'consequence-1',
        type: 'direct',
        description: 'Positive outcome',
        impact_score: 15,
        probability: 0.8
      }
    ]
  },
  {
    id: 'decision-2',
    text: 'Made second decision',
    riskLevel: 'high',
    nextStateId: 'state-3',
    consequences: [
      {
        id: 'consequence-2',
        type: 'second-order',
        description: 'Negative consequence',
        impact_score: -10,
        probability: 0.6
      }
    ]
  }
]

describe('VisualizationPanel', () => {
  const renderVisualizationPanel = (props = {}) => {
    const defaultProps = {
      stateHistory: ['state-1', 'state-2', 'state-3'],
      decisionHistory: mockDecisionHistory,
      currentState: mockCurrentState,
      timePressure: 0.3,
      ...props
    }

    return render(<VisualizationPanel {...defaultProps} />)
  }

  it('renders analytics section', () => {
    renderVisualizationPanel()

    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Decision Path')).toBeInTheDocument()
    expect(screen.getByText('Performance')).toBeInTheDocument()
  })

  it('displays decision history', () => {
    renderVisualizationPanel()

    expect(screen.getByText('Made first decision')).toBeInTheDocument()
    expect(screen.getByText('Made second decision')).toBeInTheDocument()
    expect(screen.getByText('low')).toBeInTheDocument()
    expect(screen.getByText('high')).toBeInTheDocument()
  })

  it('shows performance metrics', () => {
    renderVisualizationPanel()

    expect(screen.getByText('Average Impact')).toBeInTheDocument()
    expect(screen.getByText('Risk Trend')).toBeInTheDocument()
    expect(screen.getByText('Time Pressure')).toBeInTheDocument()
  })

  it('displays insights when decisions have been made', () => {
    renderVisualizationPanel()

    expect(screen.getByText('Insights')).toBeInTheDocument()
    expect(screen.getByText('Total Decisions:')).toBeInTheDocument()
    const insightsSection = screen.getByText('Insights').closest('div')
    expect(insightsSection).toHaveTextContent('Total Decisions:')
    expect(insightsSection).toHaveTextContent('High Risk Decisions:')
    expect(screen.getByText('High Risk Decisions:')).toBeInTheDocument()
  })

  it('handles empty decision history', () => {
    renderVisualizationPanel({ decisionHistory: [] })

    expect(screen.getByText('No decisions made yet')).toBeInTheDocument()
    expect(screen.getByText('Your decision path will appear here')).toBeInTheDocument()
  })

  it('shows time pressure with correct percentage', () => {
    renderVisualizationPanel({ timePressure: 0.75 })

    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('displays placeholder for future visualizations', () => {
    renderVisualizationPanel()

    expect(screen.getByText('📊')).toBeInTheDocument()
    expect(screen.getByText('Advanced visualizations')).toBeInTheDocument()
    expect(screen.getByText('Decision trees and outcome charts will appear here')).toBeInTheDocument()
  })

  it('calculates and displays average impact correctly', () => {
    renderVisualizationPanel()

    // First decision: +15, Second decision: -10, Average: +2.5
    expect(screen.getByText('+2.5')).toBeInTheDocument()
  })

  it('shows risk trend based on recent decisions', () => {
    renderVisualizationPanel()

    // Should show some risk trend indicator
    const trendElements = screen.getAllByText(/↗️|↘️|➡️/)
    expect(trendElements.length).toBeGreaterThan(0)
  })
})