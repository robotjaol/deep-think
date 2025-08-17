import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DecisionPanel } from '../decision-panel'
import { Decision } from '@/lib/types'

const mockDecisions: Decision[] = [
  {
    id: 'decision-1',
    text: 'Take immediate action',
    riskLevel: 'low',
    nextStateId: 'state-2',
    consequences: [
      {
        id: 'consequence-1',
        type: 'direct',
        description: 'Quick resolution',
        impact_score: 15,
        probability: 0.9
      },
      {
        id: 'consequence-2',
        type: 'second-order',
        description: 'May miss underlying issues',
        impact_score: -5,
        probability: 0.3,
        delay_minutes: 30
      }
    ]
  },
  {
    id: 'decision-2',
    text: 'Conduct thorough analysis first',
    riskLevel: 'high',
    nextStateId: 'state-3',
    consequences: [
      {
        id: 'consequence-3',
        type: 'direct',
        description: 'Better understanding of situation',
        impact_score: 10,
        probability: 0.8
      },
      {
        id: 'consequence-4',
        type: 'second-order',
        description: 'Situation may worsen during analysis',
        impact_score: -20,
        probability: 0.6,
        delay_minutes: 15
      }
    ]
  }
]

describe('DecisionPanel', () => {
  const mockOnDecisionSelect = jest.fn()
  const mockOnDecisionSubmit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderDecisionPanel = (props = {}) => {
    const defaultProps = {
      decisions: mockDecisions,
      selectedDecision: null,
      onDecisionSelect: mockOnDecisionSelect,
      onDecisionSubmit: mockOnDecisionSubmit,
      timePressure: 0,
      disabled: false,
      ...props
    }

    return render(<DecisionPanel {...defaultProps} />)
  }

  it('renders all available decisions', () => {
    renderDecisionPanel()

    expect(screen.getByText('Take immediate action')).toBeInTheDocument()
    expect(screen.getByText('Conduct thorough analysis first')).toBeInTheDocument()
    expect(screen.getByText('LOW RISK')).toBeInTheDocument()
    expect(screen.getByText('HIGH RISK')).toBeInTheDocument()
  })

  it('handles decision selection', () => {
    renderDecisionPanel()

    const decision1 = screen.getByText('Take immediate action')
    fireEvent.click(decision1)

    expect(mockOnDecisionSelect).toHaveBeenCalledWith(mockDecisions[0])
  })

  it('shows confirm button when decision is selected', () => {
    renderDecisionPanel({ selectedDecision: mockDecisions[0] })

    expect(screen.getByText('Confirm Decision')).toBeInTheDocument()
  })

  it('handles decision submission', () => {
    renderDecisionPanel({ selectedDecision: mockDecisions[0] })

    const confirmButton = screen.getByText('Confirm Decision')
    fireEvent.click(confirmButton)

    expect(mockOnDecisionSubmit).toHaveBeenCalledWith(mockDecisions[0])
  })

  it('shows consequence preview when requested', () => {
    renderDecisionPanel()

    const previewButton = screen.getAllByText('Preview Consequences')[0]
    fireEvent.click(previewButton)

    expect(screen.getByText('Potential Consequences')).toBeInTheDocument()
    expect(screen.getByText('Quick resolution')).toBeInTheDocument()
    expect(screen.getByText('Impact: +15')).toBeInTheDocument()
    expect(screen.getByText('Probability: 90%')).toBeInTheDocument()
  })

  it('hides consequence preview when clicked again', () => {
    renderDecisionPanel()

    const previewButton = screen.getAllByText('Preview Consequences')[0]
    
    // Show consequences
    fireEvent.click(previewButton)
    expect(screen.getByText('Potential Consequences')).toBeInTheDocument()

    // Hide consequences
    const hideButton = screen.getByText('Hide Consequences')
    fireEvent.click(hideButton)
    expect(screen.queryByText('Potential Consequences')).not.toBeInTheDocument()
  })

  it('displays time pressure warning', () => {
    renderDecisionPanel({ timePressure: 0.9 })

    expect(screen.getByText('Time running out!')).toBeInTheDocument()
  })

  it('shows auto-submit warning at high time pressure', () => {
    renderDecisionPanel({ 
      selectedDecision: mockDecisions[0], 
      timePressure: 0.8 
    })

    expect(screen.getByText('⚠️ Decision will auto-submit when time expires')).toBeInTheDocument()
  })

  it('disables interactions when disabled prop is true', () => {
    renderDecisionPanel({ disabled: true })

    const decision1 = screen.getByText('Take immediate action')
    fireEvent.click(decision1)

    // Should not call selection handler when disabled
    expect(mockOnDecisionSelect).not.toHaveBeenCalled()
  })

  it('shows disabled state for confirm button when disabled', () => {
    renderDecisionPanel({ 
      selectedDecision: mockDecisions[0], 
      disabled: true 
    })

    const confirmButton = screen.getByText('Session Paused')
    expect(confirmButton).toBeDisabled()
  })

  it('displays decision tips', () => {
    renderDecisionPanel()

    expect(screen.getByText('🎯 Decision Tips')).toBeInTheDocument()
    expect(screen.getByText('• Consider both immediate and long-term impacts')).toBeInTheDocument()
    expect(screen.getByText('• Think about stakeholder reactions')).toBeInTheDocument()
  })

  it('shows different consequence types with appropriate icons', () => {
    renderDecisionPanel()

    const previewButton = screen.getAllByText('Preview Consequences')[0]
    fireEvent.click(previewButton)

    // Should show direct (⚡) and second-order (🔄) consequence icons
    const consequenceElements = screen.getAllByText(/⚡|🔄/)
    expect(consequenceElements.length).toBeGreaterThan(0)
  })

  it('displays delay information for consequences', () => {
    renderDecisionPanel()

    const previewButton = screen.getAllByText('Preview Consequences')[0]
    fireEvent.click(previewButton)

    expect(screen.getByText('Delay: 30min')).toBeInTheDocument()
  })

  it('highlights selected decision with different styling', () => {
    renderDecisionPanel({ selectedDecision: mockDecisions[0] })

    // Find the decision container div that should have the selected styling
    const decisionContainers = document.querySelectorAll('.border-blue-500')
    expect(decisionContainers.length).toBeGreaterThan(0)
    
    // Check that the selected decision text is present
    expect(screen.getByText('Take immediate action')).toBeInTheDocument()
  })
})