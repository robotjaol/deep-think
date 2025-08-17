import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { DecisionTimer } from '../decision-timer'

describe('DecisionTimer', () => {
  const mockOnTimeout = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const renderDecisionTimer = (props = {}) => {
    const defaultProps = {
      timeLimit: 60, // 60 seconds
      timePressure: 0,
      isActive: true,
      onTimeout: mockOnTimeout,
      ...props
    }

    return render(<DecisionTimer {...defaultProps} />)
  }

  it('renders timer with correct initial time', () => {
    renderDecisionTimer()

    expect(screen.getByText('1:00')).toBeInTheDocument()
  })

  it('updates time display as pressure increases', () => {
    renderDecisionTimer({ timePressure: 0.5 })

    expect(screen.getByText('0:30')).toBeInTheDocument()
  })

  it('shows warning icon at high time pressure', () => {
    renderDecisionTimer({ timePressure: 0.9 })

    expect(screen.getByText('⚠️')).toBeInTheDocument()
  })

  it('displays paused state when not active', () => {
    renderDecisionTimer({ isActive: false })

    expect(screen.getByText('Paused')).toBeInTheDocument()
  })

  it('changes color based on time pressure level', () => {
    const { rerender } = renderDecisionTimer({ timePressure: 0.2 })
    
    // Low pressure - green
    let timerElement = screen.getByText('0:48')
    expect(timerElement).toHaveClass('text-green-600')

    // Medium pressure - yellow
    rerender(
      <DecisionTimer
        timeLimit={60}
        timePressure={0.7}
        isActive={true}
        onTimeout={mockOnTimeout}
      />
    )
    timerElement = screen.getByText('0:18')
    expect(timerElement).toHaveClass('text-yellow-600')

    // High pressure - red
    rerender(
      <DecisionTimer
        timeLimit={60}
        timePressure={0.9}
        isActive={true}
        onTimeout={mockOnTimeout}
      />
    )
    timerElement = screen.getByText(/0:0[5-6]/)
    expect(timerElement).toHaveClass('text-red-600')
  })

  it('calls onTimeout when time runs out', () => {
    renderDecisionTimer({ timePressure: 1.0 })

    act(() => {
      jest.advanceTimersByTime(200) // Advance past the 100ms interval
    })

    expect(mockOnTimeout).toHaveBeenCalled()
  })

  it('does not update when inactive', () => {
    renderDecisionTimer({ isActive: false, timePressure: 0.5 })

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    // Should still show initial time since timer is inactive
    expect(screen.getByText('0:30')).toBeInTheDocument()
    expect(mockOnTimeout).not.toHaveBeenCalled()
  })

  it('shows progress bar with correct width', () => {
    renderDecisionTimer({ timePressure: 0.3 })

    const progressBar = document.querySelector('.bg-green-500')
    expect(progressBar).toHaveStyle({ width: '70%' })
  })

  it('formats time correctly for different durations', () => {
    const { rerender } = renderDecisionTimer({ timeLimit: 125, timePressure: 0 })
    expect(screen.getByText('2:05')).toBeInTheDocument()

    rerender(
      <DecisionTimer
        timeLimit={3661}
        timePressure={0}
        isActive={true}
        onTimeout={mockOnTimeout}
      />
    )
    expect(screen.getByText('61:01')).toBeInTheDocument()
  })

  it('handles zero time remaining', () => {
    renderDecisionTimer({ timePressure: 1.0 })

    expect(screen.getByText('0:00')).toBeInTheDocument()
  })

  it('progress bar changes color with pressure', () => {
    const { rerender } = renderDecisionTimer({ timePressure: 0.2 })
    
    let progressBar = document.querySelector('.bg-green-500')
    expect(progressBar).toBeInTheDocument()

    rerender(
      <DecisionTimer
        timeLimit={60}
        timePressure={0.7}
        isActive={true}
        onTimeout={mockOnTimeout}
      />
    )
    progressBar = document.querySelector('.bg-yellow-500')
    expect(progressBar).toBeInTheDocument()

    rerender(
      <DecisionTimer
        timeLimit={60}
        timePressure={0.9}
        isActive={true}
        onTimeout={mockOnTimeout}
      />
    )
    progressBar = document.querySelector('.bg-red-500')
    expect(progressBar).toBeInTheDocument()
  })
})