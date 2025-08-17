import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { SessionReplay } from '../session-replay'
import { TrainingSession, SessionDecision } from '@/lib/types'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: {
            config: {
              id: 'scenario-1',
              title: 'Test Scenario',
              initialState: {
                id: 'initial',
                description: 'Initial scenario state',
                context: 'Test context',
                decisions: [],
                environmentalFactors: ['Factor 1', 'Factor 2'],
                characters: [
                  { id: 'char-1', name: 'John Doe', role: 'Manager' }
                ],
                riskLevel: 'medium',
                criticalityScore: 75
              },
              states: {
                'initial': {
                  id: 'initial',
                  description: 'Initial scenario state',
                  context: 'Test context',
                  decisions: [],
                  environmentalFactors: ['Factor 1', 'Factor 2'],
                  characters: [
                    { id: 'char-1', name: 'John Doe', role: 'Manager' }
                  ],
                  riskLevel: 'medium',
                  criticalityScore: 75
                },
                'state-1': {
                  id: 'state-1',
                  description: 'Second scenario state',
                  context: 'Updated context',
                  decisions: [],
                  environmentalFactors: ['Factor 3'],
                  characters: [
                    { id: 'char-2', name: 'Jane Smith', role: 'Analyst' }
                  ],
                  riskLevel: 'high',
                  criticalityScore: 90
                }
              }
            }
          },
          error: null
        }))
      }))
    }))
  }))
}

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: () => mockSupabaseClient
}))

// Mock timers
jest.useFakeTimers()

const mockSession: TrainingSession = {
  id: 'session-1',
  user_id: 'user-1',
  scenario_id: 'scenario-1',
  configuration: {
    domain: 'cybersecurity',
    jobRole: 'Security Analyst',
    riskProfile: 'balanced',
    scenarioHistory: []
  },
  started_at: '2024-01-15T10:00:00Z',
  completed_at: '2024-01-15T10:30:00Z',
  final_score: 85.5,
  session_data: {
    decisions_made: [],
    state_history: ['initial', 'state-1'],
    time_spent_seconds: 1800,
    pause_count: 1,
    hints_used: 0,
    current_context: {}
  },
  current_state_id: 'final',
  is_paused: false
}

const mockDecisions: SessionDecision[] = [
  {
    id: 'decision-1',
    session_id: 'session-1',
    state_id: 'initial',
    decision_text: 'First decision',
    timestamp: '2024-01-15T10:05:00Z',
    time_taken_ms: 15000,
    score_impact: 90,
    consequences: [
      {
        id: 'consequence-1',
        type: 'direct',
        description: 'Immediate effect',
        impact_score: 90,
        probability: 1.0
      }
    ],
    user_confidence: 4
  },
  {
    id: 'decision-2',
    session_id: 'session-1',
    state_id: 'state-1',
    decision_text: 'Second decision',
    timestamp: '2024-01-15T10:10:00Z',
    time_taken_ms: 20000,
    score_impact: 75,
    consequences: [
      {
        id: 'consequence-2',
        type: 'second-order',
        description: 'Delayed effect',
        impact_score: 75,
        probability: 0.8,
        delay_minutes: 10
      }
    ],
    user_confidence: 3
  }
]

describe('SessionReplay Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
  })

  it('renders replay controls correctly', async () => {
    render(
      <SessionReplay
        session={mockSession}
        decisions={mockDecisions}
        loading={false}
        error={null}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Session Replay')).toBeInTheDocument()
      expect(screen.getByText('Step 0 of 2')).toBeInTheDocument()
      expect(screen.getByTitle('Reset to beginning')).toBeInTheDocument()
      expect(screen.getByTitle('Step backward')).toBeInTheDocument()
      expect(screen.getByTitle('Play')).toBeInTheDocument()
      expect(screen.getByTitle('Step forward')).toBeInTheDocument()
    })
  })

  it('displays progress bar correctly', async () => {
    render(
      <SessionReplay
        session={mockSession}
        decisions={mockDecisions}
        loading={false}
        error={null}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Progress:')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })

  it('shows clickable timeline steps', async () => {
    render(
      <SessionReplay
        session={mockSession}
        decisions={mockDecisions}
        loading={false}
        error={null}
      />
    )

    await waitFor(() => {
      const timelineButtons = screen.getAllByRole('button')
      const stepButtons = timelineButtons.filter(btn => 
        btn.getAttribute('title')?.startsWith('Go to decision')
      )
      expect(stepButtons).toHaveLength(2)
    })
  })

  it('handles step forward functionality', async () => {
    render(
      <SessionReplay
        session={mockSession}
        decisions={mockDecisions}
        loading={false}
        error={null}
      />
    )

    await waitFor(() => {
      const stepForwardButton = screen.getByTitle('Step forward')
      fireEvent.click(stepForwardButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument()
    })
  })

  it('handles step backward functionality', async () => {
    render(
      <SessionReplay
        session={mockSession}
        decisions={mockDecisions}
        loading={false}
        error={null}
      />
    )

    // First step forward
    await waitFor(() => {
      const stepForwardButton = screen.getByTitle('Step forward')
      fireEvent.click(stepForwardButton)
    })

    // Then step backward
    await waitFor(() => {
      const stepBackwardButton = screen.getByTitle('Step backward')
      fireEvent.click(stepBackwardButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Step 0 of 2')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })

  it('handles reset functionality', async () => {
    render(
      <SessionReplay
        session={mockSession}
        decisions={mockDecisions}
        loading={false}
        error={null}
      />
    )

    // Step forward first
    await waitFor(() => {
      const stepForwardButton = screen.getByTitle('Step forward')
      fireEvent.click(stepForwardButton)
    })

    // Then reset
    await waitFor(() => {
      const resetButton = screen.getByTitle('Reset to beginning')
      fireEvent.click(resetButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Step 0 of 2')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })

  it('handles play/pause functionality', async () => {
    render(
      <SessionReplay
        session={mockSession}
        decisions={mockDecisions}
        loading={false}
        error={null}
      />
    )

    // Start playing
    await waitFor(() => {
      const playButton = screen.getByTitle('Play')
      fireEvent.click(playButton)
    })

    await waitFor(() => {
      expect(screen.getByTitle('Pause')).toBeInTheDocument()
    })

    // Advance timer to trigger step
    act(() => {
      jest.advanceTimersByTime(2000)
    })

    await waitFor(() => {
      expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
    })

    // Pause
    const pauseButton = screen.getByTitle('Pause')
    fireEvent.click(pauseButton)

    await waitFor(() => {
      expect(screen.getByTitle('Play')).toBeInTheDocument()
    })
  })

  it('changes playback speed', async () => {
    render(
      <SessionReplay
        session={mockSession}
        decisions={mockDecisions}
        loading={false}
        error={null}
      />
    )

    await waitFor(() => {
      const speed2xButton = screen.getByText('2x')
      fireEvent.click(speed2xButton)
    })

    // Start playing at 2x speed
    const playButton = screen.getByTitle('Play')
    fireEvent.click(playButton)

    // At 2x speed, should advance in 1 second instead of 2
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
    })
  })

  it('seeks to specific step via timeline', async () => {
    render(
      <SessionReplay
        session={mockSession}
        decisions={mockDecisions}
        loading={false}
        error={null}
      />
    )

    await waitFor(() => {
      const timelineButtons = screen.getAllByRole('button')
      const step2Button = timelineButtons.find(btn => 
        btn.getAttribute('title') === 'Go to decision 2'
      )
      if (step2Button) {
        fireEvent.click(step2Button)
      }
    })

    await waitFor(() => {
      expect(screen.getByText('Step 2 of 2')).toBeInTheDocument()
      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })

  it('displays current scenario state', async () => {
    render(
      <SessionReplay
        session={mockSession}
        decisions={mockDecisions}
        loading={false}
        error={null}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Current Scenario State')).toBeInTheDocument()
      expect(screen.getByText('Initial scenario state')).toBeInTheDocument()
      expect(screen.getByText('Test context')).toBeInTheDocument()
      expect(screen.getByText('Factor 1')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })

  it('updates scenario state when stepping through decisions', async () => {
    render(
      <SessionReplay
        session={mockSession}
        decisions={mockDecisions}
        loading={false}
        error={null}
      />
    )

    // Step forward to second decision
    await waitFor(() => {
      const stepForwardButton = screen.getByTitle('Step forward')
      fireEvent.click(stepForwardButton)
      fireEvent.click(stepForwardButton) // Step to decision 2
    })

    await waitFor(() => {
      expect(screen.getByText('Second scenario state')).toBeInTheDocument()
      expect(screen.getByText('Updated context')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  it('shows decisions made so far', async () => {
    render(
      <SessionReplay
        session={mockSession}
        decisions={mockDecisions}
        loading={false}
        error={null}
      />
    )

    // Step forward to show first decision
    await waitFor(() => {
      const stepForwardButton = screen.getByTitle('Step forward')
      fireEvent.click(stepForwardButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Decisions Made So Far')).toBeInTheDocument()
      expect(screen.getByText('First decision')).toBeInTheDocument()
      expect(screen.getByText('Decision 1')).toBeInTheDocument()
      expect(screen.getByText('(Current)')).toBeInTheDocument()
    })
  })

  it('handles loading state', () => {
    render(
      <SessionReplay
        session={mockSession}
        decisions={mockDecisions}
        loading={true}
        error={null}
      />
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('handles error state', () => {
    render(
      <SessionReplay
        session={mockSession}
        decisions={mockDecisions}
        loading={false}
        error="Failed to load replay data"
      />
    )

    expect(screen.getByText('Error loading replay data')).toBeInTheDocument()
    expect(screen.getByText('Failed to load replay data')).toBeInTheDocument()
  })

  it('shows empty state when no decisions available', () => {
    render(
      <SessionReplay
        session={mockSession}
        decisions={[]}
        loading={false}
        error={null}
      />
    )

    expect(screen.getByText('No Replay Available')).toBeInTheDocument()
    expect(screen.getByText('This session doesn\'t have enough data for replay functionality.')).toBeInTheDocument()
  })

  it('disables controls appropriately', async () => {
    render(
      <SessionReplay
        session={mockSession}
        decisions={mockDecisions}
        loading={false}
        error={null}
      />
    )

    await waitFor(() => {
      // At step 0, backward should be disabled
      const stepBackwardButton = screen.getByTitle('Step backward')
      expect(stepBackwardButton).toBeDisabled()
    })

    // Step to the end
    const stepForwardButton = screen.getByTitle('Step forward')
    fireEvent.click(stepForwardButton)
    fireEvent.click(stepForwardButton)

    await waitFor(() => {
      // At final step, forward and play should be disabled
      expect(screen.getByTitle('Step forward')).toBeDisabled()
      expect(screen.getByTitle('Play')).toBeDisabled()
    })
  })

  it('automatically stops playing at the end', async () => {
    render(
      <SessionReplay
        session={mockSession}
        decisions={mockDecisions}
        loading={false}
        error={null}
      />
    )

    // Start playing
    const playButton = screen.getByTitle('Play')
    fireEvent.click(playButton)

    // Advance through all steps
    act(() => {
      jest.advanceTimersByTime(4000) // Should complete both steps
    })

    await waitFor(() => {
      expect(screen.getByText('Step 2 of 2')).toBeInTheDocument()
      expect(screen.getByTitle('Play')).toBeInTheDocument() // Should be paused
    })
  })
})