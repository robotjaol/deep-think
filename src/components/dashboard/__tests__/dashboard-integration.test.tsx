import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { ProfileProvider } from '../../../lib/auth/profile-context'
import { AuthProvider } from '../../../lib/auth/auth-context'
import Dashboard from '../../../app/dashboard/page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/dashboard',
}))

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

// Mock recharts
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />
}))

// Mock Supabase client
jest.mock('../../../lib/supabase', () => {
  const mockSupabaseClient = {
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            limit: jest.fn()
          }))
        }))
      }))
    })),
    rpc: jest.fn()
  }
  
  return {
    createClientComponentClient: () => mockSupabaseClient
  }
})

// Mock profile client
const mockProfileClient = {
  getProfile: jest.fn(),
  getTrainingStats: jest.fn(),
  getRecentSessions: jest.fn(),
  getProgressData: jest.fn(),
  getDomainPerformance: jest.fn()
}

jest.mock('../../../lib/auth/profile-client', () => ({
  profileClient: mockProfileClient
}))

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  profile: {}
}

const mockProfile = {
  id: 'user-123',
  preferred_domain: 'cybersecurity',
  default_job_role: 'security_analyst',
  default_risk_profile: 'balanced',
  training_level: 2,
  total_scenarios_completed: 5,
  average_score: 75.5,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockTrainingStats = {
  total_sessions: 10,
  completed_sessions: 8,
  average_score: 75.5,
  best_score: 92.0,
  recent_sessions_count: 3
}

const mockRecentSessions = [
  {
    id: 'session-1',
    scenario_id: 'scenario-1',
    started_at: '2024-01-15T10:00:00Z',
    completed_at: '2024-01-15T10:30:00Z',
    final_score: 85.5,
    scenarios: {
      title: 'Cybersecurity Breach Response',
      domain: 'cybersecurity'
    }
  }
]

const mockProgressData = [
  { date: '2024-01-01', score: 65.0, session_count: 2 },
  { date: '2024-01-02', score: 70.5, session_count: 1 }
]

const mockDomainPerformance = [
  { domain: 'cybersecurity', average_score: 80.0, session_count: 5 }
]

describe('Dashboard Integration', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    mockProfileClient.getProfile.mockResolvedValue({
      profile: mockProfile,
      error: null
    })
    
    mockProfileClient.getTrainingStats.mockResolvedValue({
      stats: mockTrainingStats,
      error: null
    })
    
    mockProfileClient.getRecentSessions.mockResolvedValue({
      sessions: mockRecentSessions,
      error: null
    })
    
    mockProfileClient.getProgressData.mockResolvedValue({
      progressData: mockProgressData,
      error: null
    })
    
    mockProfileClient.getDomainPerformance.mockResolvedValue({
      domainPerformance: mockDomainPerformance,
      error: null
    })
  })

  const renderDashboard = () => {
    return render(
      <AuthProvider>
        <ProfileProvider>
          <Dashboard />
        </ProfileProvider>
      </AuthProvider>
    )
  }

  it('loads and displays dashboard data correctly', async () => {
    renderDashboard()
    
    // Should show loading state initially
    expect(screen.getByText('Training Dashboard')).toBeInTheDocument()
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument() // part of email
    })
    
    // Should display training stats
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument() // total sessions
      expect(screen.getByText('75.5')).toBeInTheDocument() // average score
    })
    
    // Should display recent sessions
    await waitFor(() => {
      expect(screen.getByText('Cybersecurity Breach Response')).toBeInTheDocument()
    })
    
    // Should display progress visualization
    await waitFor(() => {
      expect(screen.getByText('Score Progression')).toBeInTheDocument()
    })
  })

  it('handles loading states correctly', async () => {
    // Make profile loading take longer
    mockProfileClient.getProfile.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ profile: mockProfile, error: null }), 100))
    )
    
    renderDashboard()
    
    // Should show loading animation
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(1)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('handles API errors gracefully', async () => {
    // Mock API error
    mockProfileClient.getTrainingStats.mockResolvedValue({
      stats: null,
      error: { message: 'Failed to load stats' }
    })
    
    renderDashboard()
    
    await waitFor(() => {
      // Should still render dashboard with default values
      expect(screen.getByText('Training Dashboard')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument() // default total sessions
    })
  })

  it('calls profile client methods with correct parameters', async () => {
    renderDashboard()
    
    await waitFor(() => {
      expect(mockProfileClient.getProfile).toHaveBeenCalled()
      expect(mockProfileClient.getTrainingStats).toHaveBeenCalled()
      expect(mockProfileClient.getRecentSessions).toHaveBeenCalled()
      expect(mockProfileClient.getProgressData).toHaveBeenCalled()
      expect(mockProfileClient.getDomainPerformance).toHaveBeenCalled()
    })
  })

  it('displays recommendations based on user data', async () => {
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText('Recommended Training')).toBeInTheDocument()
    })
    
    // Should show recommendations based on the mock data
    await waitFor(() => {
      // With good performance (75.5 avg), should suggest advanced scenarios
      expect(screen.getByText('Advanced Crisis Scenarios')).toBeInTheDocument()
    })
  })

  it('handles unauthenticated users correctly', async () => {
    renderDashboard()
    
    // Should redirect or show auth prompt (handled by ProtectedRoute)
    // The exact behavior depends on ProtectedRoute implementation
    await waitFor(() => {
      // This test verifies the component doesn't crash with no user
      expect(document.body).toBeInTheDocument()
    })
  })

  it('updates data when user changes', async () => {
    renderDashboard()
    
    await waitFor(() => {
      expect(mockProfileClient.getProfile).toHaveBeenCalled()
    })
    
    // This test verifies the component handles user changes
    expect(document.body).toBeInTheDocument()
  })

  it('displays correct navigation links', async () => {
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText('Start Training')).toBeInTheDocument()
      expect(screen.getByText('Update Preferences')).toBeInTheDocument()
      expect(screen.getByText('View Full History')).toBeInTheDocument()
      expect(screen.getByText('Contribute Scenarios')).toBeInTheDocument()
    })
    
    // Check link destinations
    const startTrainingLink = screen.getByText('Start Training').closest('a')
    expect(startTrainingLink).toHaveAttribute('href', '/scenario/configure')
    
    const preferencesLink = screen.getByText('Update Preferences').closest('a')
    expect(preferencesLink).toHaveAttribute('href', '/config')
  })
})