import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SessionDetail } from '../session-detail'
import { TrainingSession } from '@/lib/types'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({
          data: [
            {
              id: 'decision-1',
              session_id: 'session-1',
              state_id: 'state-1',
              decision_text: 'Isolate affected systems',
              timestamp: '2024-01-15T10:05:00Z',
              time_taken: 15000,
              score_impact: 90,
              consequences: [
                {
                  id: 'consequence-1',
                  type: 'direct',
                  description: 'Systems isolated successfully',
                  impact_score: 90,
                  probability: 1.0
                }
              ],
              user_confidence: 4
            }
          ],
          error: null
        }))
      }))
    }))
  }))
}

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: () => mockSupabaseClient
}))

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
  is_paused: false,
  scenarios: {
    title: 'Ransomware Attack Response',
    domain: 'cybersecurity',
    difficulty_level: 3
  }
}

describe('SessionDetail Component', () => {
  const mockOnBack = jest.fn()
  const mockOnRefresh = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders session header information correctly', async () => {
    render(
      <SessionDetail
        session={mockSession}
        onBack={mockOnBack}
        onRefresh={mockOnRefresh}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Ransomware Attack Response')).toBeInTheDocument()
      expect(screen.getByText('cybersecurity')).toBeInTheDocument()
      expect(screen.getByText('Security Analyst')).toBeInTheDocument()
      expect(screen.getByText(/Completed on/)).toBeInTheDocument()
    })
  })

  it('displays session metrics in overview tab', async () => {
    render(
      <SessionDetail
        session={mockSession}
        onBack={mockOnBack}
        onRefresh={mockOnRefresh}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Session Metrics')).toBeInTheDocument()
      expect(screen.getByText('85.5%')).toBeInTheDocument()
      expect(screen.getByText('30m 0s')).toBeInTheDocument() // 1800 seconds = 30 minutes
    })
  })

  it('shows performance insights', async () => {
    render(
      <SessionDetail
        session={mockSession}
        onBack={mockOnBack}
        onRefresh={mockOnRefresh}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Performance Insights')).toBeInTheDocument()
    })
  })

  it('displays session details sidebar', async () => {
    render(
      <SessionDetail
        session={mockSession}
        onBack={mockOnBack}
        onRefresh={mockOnRefresh}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Session Details')).toBeInTheDocument()
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument()
      expect(screen.getByText('Level 3')).toBeInTheDocument()
      expect(screen.getByText('1 times')).toBeInTheDocument() // pause count
    })
  })

  it('switches to decisions tab and loads decision data', async () => {
    render(
      <SessionDetail
        session={mockSession}
        onBack={mockOnBack}
        onRefresh={mockOnRefresh}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Decisions')).toBeInTheDocument()
    })

    const decisionsButton = screen.getAllByText('Decisions')[0] // Get the tab button
    fireEvent.click(decisionsButton)

    await waitFor(() => {
      expect(screen.getByText('Decision Summary')).toBeInTheDocument()
      expect(screen.getByText('Decision Timeline')).toBeInTheDocument()
    })
  })

  it('switches to replay tab', async () => {
    render(
      <SessionDetail
        session={mockSession}
        onBack={mockOnBack}
        onRefresh={mockOnRefresh}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Replay')).toBeInTheDocument()
    })

    const replayButton = screen.getByText('Replay')
    fireEvent.click(replayButton)

    await waitFor(() => {
      expect(screen.getByText('Session Replay')).toBeInTheDocument()
    })
  })

  it('calls onBack when back button is clicked', async () => {
    render(
      <SessionDetail
        session={mockSession}
        onBack={mockOnBack}
        onRefresh={mockOnRefresh}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Back to History')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Back to History'))
    expect(mockOnBack).toHaveBeenCalledTimes(1)
  })

  it('handles loading state', () => {
    render(
      <SessionDetail
        session={mockSession}
        onBack={mockOnBack}
        onRefresh={mockOnRefresh}
      />
    )

    // Should show loading spinner initially
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('handles error state when loading decisions fails', async () => {
    // Mock error response
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Failed to load decisions' }
          }))
        }))
      }))
    })

    render(
      <SessionDetail
        session={mockSession}
        onBack={mockOnBack}
        onRefresh={mockOnRefresh}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Performance Insights')).toBeInTheDocument()
    })

    // Switch to decisions tab to see error
    const decisionsButton = screen.getAllByText('Decisions')[0] // Get the tab button
    fireEvent.click(decisionsButton)

    await waitFor(() => {
      expect(screen.getByText('Error loading decisions')).toBeInTheDocument()
    })
  })

  it('calculates average decision time correctly', async () => {
    render(
      <SessionDetail
        session={mockSession}
        onBack={mockOnBack}
        onRefresh={mockOnRefresh}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument() // 1 decision loaded
      expect(screen.getByText('15.0s')).toBeInTheDocument() // 15000ms = 15.0s
    })
  })

  it('shows incomplete session without final score', async () => {
    const incompleteSession = {
      ...mockSession,
      completed_at: null,
      final_score: null
    }

    render(
      <SessionDetail
        session={incompleteSession}
        onBack={mockOnBack}
        onRefresh={mockOnRefresh}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('N/A')).toBeInTheDocument() // No final score
      expect(screen.queryByText(/Completed on/)).not.toBeInTheDocument()
    })
  })

  it('handles session without scenario data', async () => {
    const sessionWithoutScenario = {
      ...mockSession,
      scenarios: null
    }

    render(
      <SessionDetail
        session={sessionWithoutScenario}
        onBack={mockOnBack}
        onRefresh={mockOnRefresh}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Training Session')).toBeInTheDocument() // Fallback title
    })
  })
})