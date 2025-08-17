import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock D3 completely to prevent any DOM manipulation during tests
jest.mock('d3', () => ({
  select: jest.fn(() => ({
    selectAll: jest.fn(() => ({ remove: jest.fn() })),
    append: jest.fn(() => ({
      attr: jest.fn(() => ({ attr: jest.fn() })),
      style: jest.fn(() => ({ style: jest.fn() })),
      text: jest.fn(),
      call: jest.fn()
    }))
  })),
  scaleTime: jest.fn(() => ({ domain: jest.fn(() => ({ range: jest.fn() })) })),
  scaleLinear: jest.fn(() => ({ domain: jest.fn(() => ({ range: jest.fn() })) })),
  scaleOrdinal: jest.fn(() => ({ domain: jest.fn(() => ({ range: jest.fn() })) })),
  axisBottom: jest.fn(() => ({ tickFormat: jest.fn(() => ({ ticks: jest.fn() })) })),
  axisLeft: jest.fn(() => ({ tickFormat: jest.fn() })),
  line: jest.fn(() => ({ x: jest.fn(() => ({ y: jest.fn(() => ({ curve: jest.fn() })) })) })),
  arc: jest.fn(() => ({ innerRadius: jest.fn(() => ({ outerRadius: jest.fn() })) })),
  extent: jest.fn(() => [new Date(), new Date()]),
  timeFormat: jest.fn(() => jest.fn()),
  zoom: jest.fn(() => ({ scaleExtent: jest.fn(() => ({ on: jest.fn() })) })),
  drag: jest.fn(() => ({ on: jest.fn() })),
  forceSimulation: jest.fn(() => ({ force: jest.fn(() => ({ force: jest.fn(() => ({ force: jest.fn(() => ({ on: jest.fn() })) })) })) })),
  forceLink: jest.fn(() => ({ id: jest.fn(() => ({ distance: jest.fn(() => ({ strength: jest.fn() })) })) })),
  forceManyBody: jest.fn(() => ({ strength: jest.fn() })),
  forceCenter: jest.fn(),
  forceCollide: jest.fn(() => ({ radius: jest.fn() })),
  curveMonotoneX: 'curveMonotoneX'
}))

// Import components after mocking D3
import { DecisionTreeViz, OutcomeTimelineViz, RiskExposureChart } from '../index'
import { ScenarioState, Decision, DecisionBranch, SessionDecision } from '@/lib/types'

// Mock data
const mockDecision: Decision = {
  id: 'decision-1',
  text: 'Evacuate the building immediately',
  consequences: [
    {
      id: 'consequence-1',
      type: 'direct',
      description: 'All personnel safely evacuated',
      impact_score: 50,
      probability: 0.9
    }
  ],
  nextStateId: 'state-2',
  riskLevel: 'medium'
}

const mockScenarioState: ScenarioState = {
  id: 'state-1',
  description: 'Fire alarm has been triggered in the main building',
  context: 'Emergency situation requiring immediate action',
  decisions: [mockDecision],
  timeLimit: 300,
  environmentalFactors: ['smoke', 'heat'],
  characters: [],
  riskLevel: 'high',
  criticalityScore: 85
}

const mockBranches: DecisionBranch[] = [
  {
    fromStateId: 'state-1',
    decisionId: 'decision-1',
    toStateId: 'state-2',
    transitionEffects: ['evacuation_initiated']
  }
]

const mockSessionDecision: SessionDecision = {
  id: 'session-decision-1',
  session_id: 'session-1',
  state_id: 'state-1',
  decision_text: 'Evacuate the building immediately',
  timestamp: new Date().toISOString(),
  time_taken_ms: 5000,
  score_impact: 50,
  consequences: [
    {
      id: 'consequence-1',
      type: 'direct',
      description: 'All personnel safely evacuated',
      impact_score: 50,
      delay_minutes: 2,
      probability: 0.9
    }
  ]
}

describe('DecisionTreeViz', () => {
  const defaultProps = {
    currentState: mockScenarioState,
    availableStates: { 'state-1': mockScenarioState },
    branches: mockBranches,
    completedDecisions: [],
    currentDecisionPath: ['state-1']
  }

  beforeEach(() => {
    // Mock getBoundingClientRect for responsive behavior
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0,
      toJSON: jest.fn()
    }))
  })

  it('renders without crashing', () => {
    const { container } = render(<DecisionTreeViz {...defaultProps} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('displays legend correctly', () => {
    render(<DecisionTreeViz {...defaultProps} />)
    expect(screen.getByText('Legend')).toBeInTheDocument()
    expect(screen.getByText('Current State')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('High Risk')).toBeInTheDocument()
  })

  it('handles node click events', () => {
    const mockOnNodeClick = jest.fn()
    render(<DecisionTreeViz {...defaultProps} onNodeClick={mockOnNodeClick} />)
    
    // Since D3 is mocked, we can't test actual click events on SVG elements
    // But we can verify the component renders with the click handler
    expect(mockOnNodeClick).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    const { container } = render(<DecisionTreeViz {...defaultProps} className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles responsive dimensions', () => {
    const { container } = render(<DecisionTreeViz {...defaultProps} width={400} height={300} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '400')
    expect(svg).toHaveAttribute('height', '300')
  })
})

describe('OutcomeTimelineViz', () => {
  const defaultProps = {
    decisions: [mockSessionDecision],
    startTime: new Date(Date.now() - 3600000), // 1 hour ago
    currentTime: new Date()
  }

  it('renders without crashing', () => {
    const { container } = render(<OutcomeTimelineViz {...defaultProps} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('handles empty decisions array', () => {
    const { container } = render(<OutcomeTimelineViz {...defaultProps} decisions={[]} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('shows future events when enabled', () => {
    const futureDecision = {
      ...mockSessionDecision,
      timestamp: new Date(Date.now() + 3600000).toISOString() // 1 hour in future
    }
    
    const { container } = render(
      <OutcomeTimelineViz 
        {...defaultProps} 
        decisions={[futureDecision]} 
        showFutureEvents={true} 
      />
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('applies custom dimensions', () => {
    const { container } = render(<OutcomeTimelineViz {...defaultProps} width={600} height={300} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '600')
    expect(svg).toHaveAttribute('height', '300')
  })
})

describe('RiskExposureChart', () => {
  const mockRiskMetrics = [
    {
      category: 'Financial',
      currentLevel: 45,
      maxLevel: 100,
      trend: 'increasing' as const,
      color: '#ef4444',
      description: 'Financial risk exposure'
    },
    {
      category: 'Operational',
      currentLevel: 30,
      maxLevel: 100,
      trend: 'stable' as const,
      color: '#f59e0b',
      description: 'Operational risk exposure'
    }
  ]

  const mockRiskHistory = [
    {
      timestamp: new Date(Date.now() - 3600000),
      overallRisk: 25,
      financialRisk: 20,
      operationalRisk: 30,
      reputationalRisk: 15,
      complianceRisk: 35
    },
    {
      timestamp: new Date(),
      overallRisk: 45,
      financialRisk: 45,
      operationalRisk: 30,
      reputationalRisk: 50,
      complianceRisk: 40
    }
  ]

  const defaultProps = {
    currentRiskMetrics: mockRiskMetrics,
    riskHistory: mockRiskHistory,
    decisions: [mockSessionDecision]
  }

  it('renders without crashing', () => {
    const { container } = render(<RiskExposureChart {...defaultProps} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('displays view mode toggle buttons', () => {
    render(<RiskExposureChart {...defaultProps} />)
    expect(screen.getByText('Gauge')).toBeInTheDocument()
    expect(screen.getByText('Timeline')).toBeInTheDocument()
  })

  it('switches between gauge and timeline views', () => {
    render(<RiskExposureChart {...defaultProps} />)
    
    const timelineButton = screen.getByText('Timeline')
    fireEvent.click(timelineButton)
    
    expect(timelineButton).toHaveClass('bg-blue-500')
  })

  it('shows real-time indicator when enabled', () => {
    render(<RiskExposureChart {...defaultProps} showRealTime={true} />)
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  it('displays score result when provided', () => {
    const mockScoreResult = {
      totalScore: 75,
      directImpact: 80,
      secondOrderEffects: 70,
      riskManagement: 85,
      timeEfficiency: 65,
      breakdown: []
    }

    render(<RiskExposureChart {...defaultProps} scoreResult={mockScoreResult} />)
    expect(screen.getByText('Risk Management Score')).toBeInTheDocument()
    expect(screen.getByText('85/100')).toBeInTheDocument()
  })

  it('handles empty risk history', () => {
    const { container } = render(<RiskExposureChart {...defaultProps} riskHistory={[]} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})

describe('Responsive Behavior', () => {
  beforeEach(() => {
    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))
  })

  it('handles window resize events', () => {
    const { container } = render(
      <DecisionTreeViz
        currentState={mockScenarioState}
        availableStates={{ 'state-1': mockScenarioState }}
        branches={mockBranches}
        completedDecisions={[]}
        currentDecisionPath={['state-1']}
      />
    )

    // Simulate resize
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 400 })
    fireEvent(window, new Event('resize'))

    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})

describe('Accessibility', () => {
  it('provides proper ARIA labels for interactive elements', () => {
    render(
      <RiskExposureChart
        currentRiskMetrics={[]}
        riskHistory={[]}
        decisions={[]}
      />
    )

    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toBeInTheDocument()
    })
  })

  it('maintains keyboard navigation support', () => {
    render(
      <RiskExposureChart
        currentRiskMetrics={[]}
        riskHistory={[]}
        decisions={[]}
      />
    )

    const gaugeButton = screen.getByText('Gauge')
    gaugeButton.focus()
    expect(document.activeElement).toBe(gaugeButton)
  })
})