import React from 'react'
import { render, screen } from '@testing-library/react'
import { RecentScenarios } from '../recent-scenarios'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

const mockSessions = [
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
  },
  {
    id: 'session-2',
    scenario_id: 'scenario-2',
    started_at: '2024-01-14T14:00:00Z',
    completed_at: '2024-01-14T14:25:00Z',
    final_score: 65.0,
    scenarios: {
      title: 'Healthcare Emergency Protocol',
      domain: 'healthcare'
    }
  },
  {
    id: 'session-3',
    scenario_id: 'scenario-3',
    started_at: '2024-01-13T09:00:00Z',
    completed_at: null, // In progress
    final_score: null,
    scenarios: {
      title: 'Aerospace System Failure',
      domain: 'aerospace'
    }
  }
]

describe('RecentScenarios', () => {
  beforeEach(() => {
    // Mock Date.now() to return a consistent timestamp for testing
    jest.spyOn(Date, 'now').mockImplementation(() => new Date('2024-01-15T12:00:00Z').getTime())
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders loading state correctly', () => {
    render(<RecentScenarios sessions={[]} loading={true} />)
    
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(4) // Header + 3 skeleton items
  })

  it('displays recent sessions correctly', () => {
    render(<RecentScenarios sessions={mockSessions} />)
    
    expect(screen.getByText('Recent Training Sessions')).toBeInTheDocument()
    expect(screen.getByText('Cybersecurity Breach Response')).toBeInTheDocument()
    expect(screen.getByText('Healthcare Emergency Protocol')).toBeInTheDocument()
    expect(screen.getByText('Aerospace System Failure')).toBeInTheDocument()
  })

  it('shows correct status badges based on scores', () => {
    render(<RecentScenarios sessions={mockSessions} />)
    
    // High score (85.5) should show "Excellent"
    expect(screen.getByText('Excellent')).toBeInTheDocument()
    
    // Medium score (65.0) should show "Good"
    expect(screen.getByText('Good')).toBeInTheDocument()
    
    // In progress session should show "In Progress"
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('displays correct action buttons', () => {
    render(<RecentScenarios sessions={mockSessions} />)
    
    // Completed sessions should have "Review" button
    const reviewButtons = screen.getAllByText('Review')
    expect(reviewButtons).toHaveLength(2)
    
    // In progress session should have "Continue" button
    expect(screen.getByText('Continue')).toBeInTheDocument()
  })

  it('shows domain icons correctly', () => {
    render(<RecentScenarios sessions={mockSessions} />)
    
    // Should display domain names
    expect(screen.getByText('cybersecurity')).toBeInTheDocument()
    expect(screen.getByText('healthcare')).toBeInTheDocument()
    expect(screen.getByText('aerospace')).toBeInTheDocument()
  })

  it('formats dates correctly', () => {
    render(<RecentScenarios sessions={mockSessions} />)
    
    // Should show formatted dates (actual format depends on current time)
    expect(screen.getByText(/1\/15\/2024|1\/14\/2024|1\/13\/2024/)).toBeInTheDocument()
  })

  it('shows empty state when no sessions', () => {
    render(<RecentScenarios sessions={[]} />)
    
    expect(screen.getByText('No Training Sessions Yet')).toBeInTheDocument()
    expect(screen.getByText('Start your first crisis decision training scenario to see your progress here.')).toBeInTheDocument()
    expect(screen.getByText('Start Training')).toBeInTheDocument()
  })

  it('includes scores in session details', () => {
    render(<RecentScenarios sessions={mockSessions} />)
    
    expect(screen.getByText(/85\.5/)).toBeInTheDocument()
    expect(screen.getByText(/65\.0/)).toBeInTheDocument()
  })

  it('has correct navigation links', () => {
    render(<RecentScenarios sessions={mockSessions} />)
    
    // Should have link to full history
    expect(screen.getByText('View all →')).toBeInTheDocument()
    expect(screen.getByText('View Complete Training History')).toBeInTheDocument()
    
    // Review links should point to results page
    const reviewLinks = screen.getAllByText('Review')
    expect(reviewLinks[0].closest('a')).toHaveAttribute('href', '/scenario/results?session=session-1')
    
    // Continue link should point to scenario page
    const continueLink = screen.getByText('Continue')
    expect(continueLink.closest('a')).toHaveAttribute('href', '/scenario/scenario-3?session=session-3')
  })
})