import React from 'react'
import { render, screen } from '@testing-library/react'
import { ProgressTracker } from '../progress-tracker'
import { ScenarioState, Decision } from '@/lib/types'

const mockCurrentState: ScenarioState = {
  id: 'state-3',
  description: 'Current state description',
  context: 'Current context',
  decisions: [
    {
      id: 'decision-next',
      text: 'Next decision',
      riskLevel: 'medium',
      nextStateId: 'state-4',
      consequences: []
    }
  ],
  timeLimit: 60,
  environmentalFactors: [],
  characters: [],
  riskLevel: 'medium',
  criticalityScore: 60
}

const mockDecisionHistory: Decision[] = [
  {
    id: 'decision-1',
    text: 'First decision made',
    riskLevel: 'low',
    nextStateId: 'state-2',
    consequences: []
  },
  {
    id: 'decision-2',
    text: 'Second decision made',
    riskLevel: 'high',
    nextStateId: 'state-3',
    consequences: []
  }
]

describe('ProgressTracker', () => {
  const renderProgressTracker = (props = {}) => {
    const defaultProps = {
      stateHistory: ['state-1', 'state-2', 'state-3'],
      decisionHistory: mockDecisionHistory,
      currentState: mockCurrentState,
      ...props
    }

    return render(<ProgressTracker {...defaultProps} />)
  }

  it('displays current step information', () => {
    renderProgressTracker()

    expect(screen.getByText('Step:')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows number of decisions made', () => {
    renderProgressTracker()

    expect(screen.getByText('Decisions:')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('displays current risk level with appropriate styling', () => {
    renderProgressTracker()

    expect(screen.getByText('Risk:')).toBeInTheDocument()
    const riskBadge = screen.getByText('MEDIUM')
    expect(riskBadge).toHaveClass('bg-yellow-100', 'text-yellow-700')
  })

  it('shows progress steps with correct styling', () => {
    renderProgressTracker()

    // Should show progress dots for each state
    const progressDots = document.querySelectorAll('.w-3.h-3.rounded-full')
    expect(progressDots.length).toBeGreaterThan(0)
  })

  it('handles terminal state correctly', () => {
    const terminalState = { ...mockCurrentState, decisions: [] }
    
    renderProgressTracker({ currentState: terminalState })

    expect(screen.getByText('✓ Complete')).toBeInTheDocument()
  })

  it('handles different risk levels with appropriate colors', () => {
    const highRiskState = { ...mockCurrentState, riskLevel: 'high' as const }
    
    renderProgressTracker({ currentState: highRiskState })

    const riskBadge = screen.getByText('HIGH')
    expect(riskBadge).toHaveClass('bg-red-100', 'text-red-700')
  })

  it('handles low risk level styling', () => {
    const lowRiskState = { ...mockCurrentState, riskLevel: 'low' as const }
    
    renderProgressTracker({ currentState: lowRiskState })

    const riskBadge = screen.getByText('LOW')
    expect(riskBadge).toHaveClass('bg-green-100', 'text-green-700')
  })

  it('handles long state history by showing overflow indicator', () => {
    const longStateHistory = Array.from({ length: 12 }, (_, i) => `state-${i + 1}`)
    
    renderProgressTracker({ stateHistory: longStateHistory })

    expect(screen.getByText('+4 more')).toBeInTheDocument()
  })

  it('handles empty decision history', () => {
    renderProgressTracker({ decisionHistory: [] })

    expect(screen.getByText('Decisions:')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('handles single step scenario', () => {
    renderProgressTracker({ 
      stateHistory: ['state-1'],
      decisionHistory: []
    })

    expect(screen.getByText('Step:')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})