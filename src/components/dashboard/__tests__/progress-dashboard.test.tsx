import React from 'react'
import { render, screen } from '@testing-library/react'
import { ProgressDashboard } from '../progress-dashboard'

// Mock recharts components
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

const mockMetrics = {
  total_sessions: 10,
  completed_sessions: 8,
  average_score: 75.5,
  best_score: 92.0,
  recent_sessions_count: 3
}

const mockProgressData = [
  { date: '2024-01-01', score: 65.0, session_count: 2 },
  { date: '2024-01-02', score: 70.5, session_count: 1 },
  { date: '2024-01-03', score: 75.0, session_count: 3 }
]

const mockDomainPerformance = [
  { domain: 'cybersecurity', average_score: 80.0, session_count: 5 },
  { domain: 'healthcare', average_score: 70.0, session_count: 3 }
]

describe('ProgressDashboard', () => {
  it('renders loading state correctly', () => {
    render(<ProgressDashboard metrics={mockMetrics} loading={true} />)
    
    // Should show loading skeletons
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(1)
  })

  it('displays key metrics correctly', () => {
    render(<ProgressDashboard metrics={mockMetrics} />)
    
    expect(screen.getByText('Training Progress')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument() // total sessions
    expect(screen.getByText('80%')).toBeInTheDocument() // completion rate (8/10 * 100)
    expect(screen.getByText('75.5')).toBeInTheDocument() // average score
    expect(screen.getByText('92.0')).toBeInTheDocument() // best score
  })

  it('renders progress chart when data is available', () => {
    render(
      <ProgressDashboard 
        metrics={mockMetrics} 
        progressData={mockProgressData}
      />
    )
    
    expect(screen.getByText('Score Progression')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('renders domain performance charts when data is available', () => {
    render(
      <ProgressDashboard 
        metrics={mockMetrics} 
        domainPerformance={mockDomainPerformance}
      />
    )
    
    expect(screen.getByText('Performance by Domain')).toBeInTheDocument()
    expect(screen.getByText('Session Distribution')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })

  it('shows empty state when no data is available', () => {
    render(<ProgressDashboard metrics={mockMetrics} />)
    
    expect(screen.getByText('No Training Data Yet')).toBeInTheDocument()
    expect(screen.getByText('Complete some training scenarios to see your progress visualization.')).toBeInTheDocument()
    expect(screen.getByText('Start Your First Scenario')).toBeInTheDocument()
  })

  it('calculates completion rate correctly', () => {
    const zeroSessionsMetrics = {
      total_sessions: 0,
      completed_sessions: 0,
      average_score: 0,
      best_score: 0,
      recent_sessions_count: 0
    }
    
    render(<ProgressDashboard metrics={zeroSessionsMetrics} />)
    
    // Should show 0% when no sessions
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('shows improvement trend when progress data has multiple points', () => {
    render(
      <ProgressDashboard 
        metrics={mockMetrics} 
        progressData={mockProgressData}
      />
    )
    
    // Should show positive trend (75.0 - 65.0 = +10.0)
    expect(screen.getByText('+10.0 trend')).toBeInTheDocument()
  })
})