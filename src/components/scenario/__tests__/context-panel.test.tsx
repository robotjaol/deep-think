import React from 'react'
import { render, screen } from '@testing-library/react'
import { ContextPanel } from '../context-panel'
import { ScenarioState } from '@/lib/types'

const mockState: ScenarioState = {
  id: 'test-state-1',
  description: 'A critical situation requiring immediate attention',
  context: 'You are the incident commander dealing with a complex emergency scenario',
  decisions: [],
  timeLimit: 120,
  environmentalFactors: [
    'Limited communication with remote teams',
    'Weather conditions affecting operations',
    'Resource constraints due to budget cuts'
  ],
  characters: [
    {
      id: 'char-1',
      name: 'Dr. Sarah Johnson',
      role: 'Emergency Coordinator',
      personality_traits: ['analytical', 'calm-under-pressure'],
      communication_style: 'Direct and methodical',
      expertise_areas: ['crisis management', 'resource allocation', 'team coordination']
    },
    {
      id: 'char-2',
      name: 'Mike Chen',
      role: 'Operations Manager',
      personality_traits: ['decisive', 'pragmatic'],
      communication_style: 'Concise and action-oriented',
      expertise_areas: ['logistics', 'field operations']
    }
  ],
  riskLevel: 'high',
  criticalityScore: 85
}

const mockContext = {
  currentRiskLevel: 'high',
  criticalityScore: 85,
  environmentalFactors: mockState.environmentalFactors,
  availableCharacters: mockState.characters,
  timeRemaining: 120
}

describe('ContextPanel', () => {
  const renderContextPanel = (timePressure = 0) => {
    return render(
      <ContextPanel
        state={mockState}
        context={mockContext}
        timePressure={timePressure}
      />
    )
  }

  it('renders scenario description and context', () => {
    renderContextPanel()

    expect(screen.getByText('Current Situation')).toBeInTheDocument()
    expect(screen.getByText('A critical situation requiring immediate attention')).toBeInTheDocument()
    expect(screen.getByText('Context')).toBeInTheDocument()
    expect(screen.getByText('You are the incident commander dealing with a complex emergency scenario')).toBeInTheDocument()
  })

  it('displays risk level with appropriate styling', () => {
    renderContextPanel()

    expect(screen.getByText('Risk Level')).toBeInTheDocument()
    const riskBadge = screen.getByText('HIGH')
    expect(riskBadge).toBeInTheDocument()
    expect(riskBadge).toHaveClass('text-red-600', 'bg-red-100')
  })

  it('shows criticality score with progress bar', () => {
    renderContextPanel()

    expect(screen.getByText('Criticality')).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument()
    
    const progressBar = document.querySelector('.bg-red-500')
    expect(progressBar).toHaveStyle({ width: '85%' })
  })

  it('displays time pressure indicator when time limit is set', () => {
    renderContextPanel(0.6)

    expect(screen.getByText('Time Pressure')).toBeInTheDocument()
    expect(screen.getByText('60%')).toBeInTheDocument()
    
    const pressureBar = document.querySelector('.bg-yellow-500')
    expect(pressureBar).toBeInTheDocument()
  })

  it('lists environmental factors', () => {
    renderContextPanel()

    expect(screen.getByText('Environmental Factors')).toBeInTheDocument()
    expect(screen.getByText('Limited communication with remote teams')).toBeInTheDocument()
    expect(screen.getByText('Weather conditions affecting operations')).toBeInTheDocument()
    expect(screen.getByText('Resource constraints due to budget cuts')).toBeInTheDocument()
  })

  it('displays character information', () => {
    renderContextPanel()

    expect(screen.getByText('Key Personnel')).toBeInTheDocument()
    
    // Check first character
    expect(screen.getByText('Dr. Sarah Johnson')).toBeInTheDocument()
    expect(screen.getByText('Emergency Coordinator')).toBeInTheDocument()
    expect(screen.getByText('crisis management')).toBeInTheDocument()
    expect(screen.getByText('Direct and methodical')).toBeInTheDocument()
    
    // Check second character
    expect(screen.getByText('Mike Chen')).toBeInTheDocument()
    expect(screen.getByText('Operations Manager')).toBeInTheDocument()
    expect(screen.getByText('logistics')).toBeInTheDocument()
  })

  it('shows decision-making tips', () => {
    renderContextPanel()

    expect(screen.getByText('💡 Consider')).toBeInTheDocument()
    expect(screen.getByText('• What are the immediate vs. long-term consequences?')).toBeInTheDocument()
    expect(screen.getByText('• Who are the key stakeholders affected?')).toBeInTheDocument()
  })

  it('handles different risk levels with appropriate colors', () => {
    const lowRiskState = { ...mockState, riskLevel: 'low' as const }
    const lowRiskContext = { ...mockContext, currentRiskLevel: 'low' }
    
    render(
      <ContextPanel
        state={lowRiskState}
        context={lowRiskContext}
        timePressure={0}
      />
    )

    const riskBadge = screen.getByText('LOW')
    expect(riskBadge).toHaveClass('text-green-600', 'bg-green-100')
  })

  it('handles scenarios without time limits', () => {
    const noTimeState = { ...mockState, timeLimit: undefined }
    
    render(
      <ContextPanel
        state={noTimeState}
        context={mockContext}
        timePressure={0}
      />
    )

    expect(screen.queryByText('Time Pressure')).not.toBeInTheDocument()
  })

  it('handles scenarios without environmental factors', () => {
    const noFactorsState = { ...mockState, environmentalFactors: [] }
    const noFactorsContext = { ...mockContext, environmentalFactors: [] }
    
    render(
      <ContextPanel
        state={noFactorsState}
        context={noFactorsContext}
        timePressure={0}
      />
    )

    expect(screen.queryByText('Environmental Factors')).not.toBeInTheDocument()
  })

  it('handles scenarios without characters', () => {
    const noCharsState = { ...mockState, characters: [] }
    const noCharsContext = { ...mockContext, availableCharacters: [] }
    
    render(
      <ContextPanel
        state={noCharsState}
        context={noCharsContext}
        timePressure={0}
      />
    )

    expect(screen.queryByText('Key Personnel')).not.toBeInTheDocument()
  })
})