import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { HistoryView } from '../history-view'
import { TrainingSession } from '@/lib/types'

// Mock the auth hook
jest.mock('@/lib/auth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' }
  })
}))

// Mock Supabase client
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: () => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [],
            error: null
          }))
        }))
      }))
    }))
  })
}))

const mockSessions: TrainingSession[] = [
  {
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
      decisions_made: [
        {
          id: 'decision-1',
          session_id: 'session-1',
          state_id: 'state-1',
          decision_text: 'Isolate affected systems immediately',
          timestamp: '2024-01-15T10:05:00Z',
          time_taken_ms: 15000,
          score_impact: 90,
          consequences: [
            {
              id: 'consequence-1',
              type: 'direct',
              description: 'Systems isolated successfully',
              impact_score: 90,
              probability: 1.0
            }
          ]
        }
      ],
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
  },
  {
    id: 'session-2',
    user_id: 'user-1',
    scenario_id: 'scenario-2',
    configuration: {
      domain: 'healthcare',
      jobRole: 'Emergency Physician',
      riskProfile: 'aggressive',
      scenarioHistory: []
    },
    started_at: '2024-01-14T14:00:00Z',
    completed_at: null,
    final_score: null,
    session_data: {
      decisions_made: [],
      state_history: ['initial'],
      time_spent_seconds: 600,
      pause_count: 0,
      hints_used: 1,
      current_context: {}
    },
    current_state_id: 'initial',
    is_paused: true,
    scenarios: {
      title: 'Mass Casualty Event',
      domain: 'healthcare',
      difficulty_level: 4
    }
  }
]

describe('History Integration Tests', () => {
  const mockOnRefresh = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('HistoryView Component', () => {
    it('renders session list with correct data', () => {
      render(<HistoryView sessions={mockSessions} onRefresh={mockOnRefresh} />)

      expect(screen.getByText('Ransomware Attack Response')).toBeInTheDocument()
      expect(screen.getByText('Mass Casualty Event')).toBeInTheDocument()
      expect(screen.getByText('cybersecurity')).toBeInTheDocument()
      expect(screen.getByText('healthcare')).toBeInTheDocument()
    })

    it('shows correct completion status badges', () => {
      render(<HistoryView sessions={mockSessions} onRefresh={mockOnRefresh} />)

      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.getByText('Incomplete')).toBeInTheDocument()
    })

    it('displays score badges for completed sessions', () => {
      render(<HistoryView sessions={mockSessions} onRefresh={mockOnRefresh} />)

      expect(screen.getByText('85.5%')).toBeInTheDocument()
    })

    it('filters sessions by domain', async () => {
      render(<HistoryView sessions={mockSessions} onRefresh={mockOnRefresh} />)

      // Expand filters
      fireEvent.click(screen.getByText('Show filters'))

      // Select cybersecurity domain
      const domainSelect = screen.getByDisplayValue('All domains')
      fireEvent.change(domainSelect, { target: { value: 'cybersecurity' } })

      await waitFor(() => {
        expect(screen.getByText('Ransomware Attack Response')).toBeInTheDocument()
        expect(screen.queryByText('Mass Casualty Event')).not.toBeInTheDocument()
      })
    })

    it('filters sessions by completion status', async () => {
      render(<HistoryView sessions={mockSessions} onRefresh={mockOnRefresh} />)

      // Expand filters
      fireEvent.click(screen.getByText('Show filters'))

      // Select completed only
      const statusSelect = screen.getByDisplayValue('All sessions')
      fireEvent.change(statusSelect, { target: { value: 'completed' } })

      await waitFor(() => {
        expect(screen.getByText('Ransomware Attack Response')).toBeInTheDocument()
        expect(screen.queryByText('Mass Casualty Event')).not.toBeInTheDocument()
      })
    })

    it('searches sessions by text query', async () => {
      render(<HistoryView sessions={mockSessions} onRefresh={mockOnRefresh} />)

      const searchInput = screen.getByPlaceholderText('Search scenarios, domains, or roles...')
      fireEvent.change(searchInput, { target: { value: 'ransomware' } })

      await waitFor(() => {
        expect(screen.getByText('Ransomware Attack Response')).toBeInTheDocument()
        expect(screen.queryByText('Mass Casualty Event')).not.toBeInTheDocument()
      })
    })

    it('clears all filters when clear button is clicked', async () => {
      render(<HistoryView sessions={mockSessions} onRefresh={mockOnRefresh} />)

      // Expand filters and set a filter
      fireEvent.click(screen.getByText('Show filters'))
      const domainSelect = screen.getByDisplayValue('All domains')
      fireEvent.change(domainSelect, { target: { value: 'cybersecurity' } })

      // Clear filters
      fireEvent.click(screen.getByText('Clear all'))

      await waitFor(() => {
        expect(screen.getByText('Ransomware Attack Response')).toBeInTheDocument()
        expect(screen.getByText('Mass Casualty Event')).toBeInTheDocument()
      })
    })

    it('navigates to session detail when session is clicked', async () => {
      render(<HistoryView sessions={mockSessions} onRefresh={mockOnRefresh} />)

      fireEvent.click(screen.getByText('Ransomware Attack Response'))

      await waitFor(() => {
        expect(screen.getByText('Back to History')).toBeInTheDocument()
        expect(screen.getByText('Overview')).toBeInTheDocument()
        expect(screen.getByText('Decisions')).toBeInTheDocument()
        expect(screen.getByText('Replay')).toBeInTheDocument()
      })
    })

    it('shows empty state when no sessions match filters', async () => {
      render(<HistoryView sessions={mockSessions} onRefresh={mockOnRefresh} />)

      const searchInput = screen.getByPlaceholderText('Search scenarios, domains, or roles...')
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

      await waitFor(() => {
        expect(screen.getByText('No sessions match your filters')).toBeInTheDocument()
        expect(screen.getByText('Clear Filters')).toBeInTheDocument()
      })
    })

    it('shows empty state when no sessions exist', () => {
      render(<HistoryView sessions={[]} onRefresh={mockOnRefresh} />)

      expect(screen.getByText('No training sessions yet')).toBeInTheDocument()
      expect(screen.getByText('Start Training')).toBeInTheDocument()
    })
  })

  describe('Session Detail Navigation', () => {
    it('switches between overview, decisions, and replay tabs', async () => {
      render(<HistoryView sessions={mockSessions} onRefresh={mockOnRefresh} />)

      // Navigate to session detail
      fireEvent.click(screen.getByText('Ransomware Attack Response'))

      await waitFor(() => {
        expect(screen.getByText('Session Metrics')).toBeInTheDocument()
      })

      // Switch to decisions tab
      fireEvent.click(screen.getByText('Decisions'))

      await waitFor(() => {
        expect(screen.getByText('Decision Summary')).toBeInTheDocument()
      })

      // Switch to replay tab
      fireEvent.click(screen.getByText('Replay'))

      await waitFor(() => {
        expect(screen.getByText('Session Replay')).toBeInTheDocument()
      })
    })

    it('navigates back to history list', async () => {
      render(<HistoryView sessions={mockSessions} onRefresh={mockOnRefresh} />)

      // Navigate to session detail
      fireEvent.click(screen.getByText('Ransomware Attack Response'))

      await waitFor(() => {
        expect(screen.getByText('Back to History')).toBeInTheDocument()
      })

      // Navigate back
      fireEvent.click(screen.getByText('Back to History'))

      await waitFor(() => {
        expect(screen.getByText('Filter Sessions')).toBeInTheDocument()
        expect(screen.getByText('Training Sessions')).toBeInTheDocument()
      })
    })
  })

  describe('Filter Functionality', () => {
    it('updates filtered count correctly', async () => {
      render(<HistoryView sessions={mockSessions} onRefresh={mockOnRefresh} />)

      // Initially shows all sessions
      expect(screen.getByText('2 of 2 sessions')).toBeInTheDocument()

      // Filter by domain
      fireEvent.click(screen.getByText('Show filters'))
      const domainSelect = screen.getByDisplayValue('All domains')
      fireEvent.change(domainSelect, { target: { value: 'cybersecurity' } })

      await waitFor(() => {
        expect(screen.getByText('1 of 2 sessions')).toBeInTheDocument()
      })
    })

    it('handles score range filtering', async () => {
      render(<HistoryView sessions={mockSessions} onRefresh={mockOnRefresh} />)

      fireEvent.click(screen.getByText('Show filters'))

      const minScoreInput = screen.getByPlaceholderText('Min')
      const maxScoreInput = screen.getByPlaceholderText('Max')

      fireEvent.change(minScoreInput, { target: { value: '80' } })
      fireEvent.change(maxScoreInput, { target: { value: '90' } })

      await waitFor(() => {
        expect(screen.getByText('Ransomware Attack Response')).toBeInTheDocument()
        expect(screen.queryByText('Mass Casualty Event')).not.toBeInTheDocument()
      })
    })

    it('handles date range filtering', async () => {
      render(<HistoryView sessions={mockSessions} onRefresh={mockOnRefresh} />)

      fireEvent.click(screen.getByText('Show filters'))

      const dateInputs = screen.getAllByDisplayValue('')
      const startDateInput = dateInputs.find(input => input.type === 'date')
      const endDateInput = dateInputs.find((input, index) => input.type === 'date' && index > 0)

      if (startDateInput && endDateInput) {
        fireEvent.change(startDateInput, { target: { value: '2024-01-15' } })
        fireEvent.change(endDateInput, { target: { value: '2024-01-15' } })

        await waitFor(() => {
          expect(screen.getByText('Ransomware Attack Response')).toBeInTheDocument()
          expect(screen.queryByText('Mass Casualty Event')).not.toBeInTheDocument()
        })
      }
    })
  })

  describe('Refresh Functionality', () => {
    it('calls onRefresh when refresh button is clicked', () => {
      render(<HistoryView sessions={mockSessions} onRefresh={mockOnRefresh} />)

      fireEvent.click(screen.getByText('Refresh'))

      expect(mockOnRefresh).toHaveBeenCalledTimes(1)
    })
  })
})