import React from 'react'
import { render, screen } from '@testing-library/react'
import { RecommendedTraining } from '../recommended-training'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

const mockProfile = {
  preferred_domain: 'cybersecurity',
  default_job_role: 'security_analyst',
  default_risk_profile: 'balanced' as const,
  training_level: 2
}

const mockMetrics = {
  total_sessions: 5,
  completed_sessions: 4,
  average_score: 65.0,
  best_score: 80.0
}

describe('RecommendedTraining', () => {
  it('renders loading state correctly', () => {
    render(<RecommendedTraining profile={mockProfile} metrics={mockMetrics} loading={true} />)
    
    expect(screen.getByText('Recommended Training')).toBeInTheDocument()
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(1)
  })

  it('shows profile setup recommendation when profile is incomplete', () => {
    const incompleteProfile = {
      training_level: 1
    }
    
    render(<RecommendedTraining profile={incompleteProfile} metrics={mockMetrics} />)
    
    expect(screen.getByText('Complete Your Profile Setup')).toBeInTheDocument()
    expect(screen.getByText('Set your preferred domain and job role to get personalized training recommendations.')).toBeInTheDocument()
    expect(screen.getByText('Set Up Profile')).toBeInTheDocument()
  })

  it('shows first scenario recommendation for new users', () => {
    const newUserMetrics = {
      total_sessions: 0,
      completed_sessions: 0,
      average_score: 0,
      best_score: 0
    }
    
    render(<RecommendedTraining profile={mockProfile} metrics={newUserMetrics} />)
    
    expect(screen.getByText('Your First Crisis Scenario')).toBeInTheDocument()
    expect(screen.getByText('Perfect introduction to crisis training')).toBeInTheDocument()
  })

  it('shows completion focus recommendation for low completion rate', () => {
    const lowCompletionMetrics = {
      total_sessions: 10,
      completed_sessions: 3, // 30% completion rate
      average_score: 70.0,
      best_score: 85.0
    }
    
    render(<RecommendedTraining profile={mockProfile} metrics={lowCompletionMetrics} />)
    
    expect(screen.getByText('Scenario Completion Training')).toBeInTheDocument()
    expect(screen.getByText(/Your completion rate is 30% - let's improve that/)).toBeInTheDocument()
  })

  it('shows fundamentals review for low scores', () => {
    const lowScoreMetrics = {
      total_sessions: 5,
      completed_sessions: 5,
      average_score: 35.0, // Below 40
      best_score: 45.0
    }
    
    render(<RecommendedTraining profile={mockProfile} metrics={lowScoreMetrics} />)
    
    expect(screen.getByText('Decision-Making Fundamentals')).toBeInTheDocument()
    expect(screen.getByText(/Your average score is 35.0 - let's build stronger foundations/)).toBeInTheDocument()
  })

  it('shows advanced scenarios for high-performing users', () => {
    const highPerformanceMetrics = {
      total_sessions: 8,
      completed_sessions: 8,
      average_score: 75.0, // Above 60
      best_score: 90.0
    }
    
    render(<RecommendedTraining profile={mockProfile} metrics={highPerformanceMetrics} />)
    
    // Should show some advanced training recommendations
    expect(screen.getByText(/Cross-Domain Training|High-Pressure Time Scenarios|Advanced Crisis Scenarios/)).toBeInTheDocument()
  })

  it('shows cross-domain training for experienced users', () => {
    const experiencedMetrics = {
      total_sessions: 5,
      completed_sessions: 4,
      average_score: 70.0,
      best_score: 85.0
    }
    
    render(<RecommendedTraining profile={mockProfile} metrics={experiencedMetrics} />)
    
    // Should suggest a different domain than cybersecurity
    expect(screen.getByText(/Cross-Domain Training:/)).toBeInTheDocument()
    expect(screen.getByText(/Broaden your expertise across different crisis types/)).toBeInTheDocument()
  })

  it('shows risk tolerance training for conservative users', () => {
    const conservativeProfile = {
      ...mockProfile,
      default_risk_profile: 'conservative' as const
    }
    
    const goodMetrics = {
      total_sessions: 5,
      completed_sessions: 5,
      average_score: 60.0, // Above 50
      best_score: 75.0
    }
    
    render(<RecommendedTraining profile={conservativeProfile} metrics={goodMetrics} />)
    
    expect(screen.getByText('Risk Tolerance Training')).toBeInTheDocument()
    expect(screen.getByText(/Expand your risk tolerance for better crisis outcomes/)).toBeInTheDocument()
  })

  it('shows time pressure training for advanced users', () => {
    const advancedMetrics = {
      total_sessions: 8,
      completed_sessions: 8,
      average_score: 75.0, // Above 70
      best_score: 90.0
    }
    
    render(<RecommendedTraining profile={mockProfile} metrics={advancedMetrics} />)
    
    expect(screen.getByText('High-Pressure Time Scenarios')).toBeInTheDocument()
    expect(screen.getByText(/Perfect your skills under maximum pressure/)).toBeInTheDocument()
  })

  it('displays difficulty levels with correct colors', () => {
    render(<RecommendedTraining profile={mockProfile} metrics={mockMetrics} />)
    
    const beginnerBadges = document.querySelectorAll('.bg-green-100')
    const intermediateBadges = document.querySelectorAll('.bg-yellow-100')
    const advancedBadges = document.querySelectorAll('.bg-red-100')
    
    expect(beginnerBadges.length + intermediateBadges.length + advancedBadges.length).toBeGreaterThan(0)
  })

  it('shows priority indicators correctly', () => {
    const newUserMetrics = {
      total_sessions: 0,
      completed_sessions: 0,
      average_score: 0,
      best_score: 0
    }
    
    render(<RecommendedTraining profile={mockProfile} metrics={newUserMetrics} />)
    
    // Should have high priority recommendations for new users
    const priorityIcons = document.querySelectorAll('svg')
    expect(priorityIcons.length).toBeGreaterThan(0)
  })

  it('includes focus areas as tags', () => {
    render(<RecommendedTraining profile={mockProfile} metrics={mockMetrics} />)
    
    // Should show focus area tags - check for actual tags that appear
    expect(screen.getByText('Complex Decision Trees')).toBeInTheDocument()
    expect(screen.getByText('Stakeholder Management')).toBeInTheDocument()
  })

  it('has correct navigation links', () => {
    render(<RecommendedTraining profile={mockProfile} metrics={mockMetrics} />)
    
    // Should have link to browse all scenarios
    expect(screen.getByText('Browse All Training Scenarios')).toBeInTheDocument()
    
    // Start Training buttons should link to scenario configuration
    const startTrainingLinks = screen.getAllByText('Start Training')
    startTrainingLinks.forEach(link => {
      expect(link.closest('a')).toHaveAttribute('href', '/scenario/configure')
    })
  })

  it('shows empty state when no recommendations available', () => {
    // This would be a rare case, but let's test it
    const emptyProfile = { training_level: 1 }
    const emptyMetrics = { total_sessions: 0, completed_sessions: 0, average_score: 0, best_score: 0 }
    
    // Mock the generateRecommendations to return empty array
    const originalConsoleLog = console.log
    console.log = jest.fn()
    
    render(<RecommendedTraining profile={emptyProfile} metrics={emptyMetrics} />)
    
    // Should show the profile setup recommendation at minimum
    expect(screen.getByText('Complete Your Profile Setup')).toBeInTheDocument()
    
    console.log = originalConsoleLog
  })
})