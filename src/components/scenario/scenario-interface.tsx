'use client'

import { useState, useEffect, useCallback } from 'react'
import { ScenarioState, Decision, TrainingSession, SessionDecision } from '@/lib/types'
import { ScenarioStateManager } from '@/lib/scenario-engine'
import { ContextPanel } from './context-panel'
import { DecisionPanel } from './decision-panel'
import { VisualizationPanel } from './visualization-panel'
import { DecisionTimer } from './decision-timer'
import { ProgressTracker } from './progress-tracker'

interface ScenarioInterfaceProps {
  session: TrainingSession
  initialState: ScenarioState
  onDecisionMade: (decision: SessionDecision) => void
  onSessionComplete: (finalScore: number) => void
  onSessionPause: () => void
  onSessionResume: () => void
}

export function ScenarioInterface({
  session,
  initialState,
  onDecisionMade,
  onSessionComplete,
  onSessionPause,
  onSessionResume
}: ScenarioInterfaceProps) {
  const [stateManager] = useState(() => new ScenarioStateManager(initialState))
  const [currentState, setCurrentState] = useState<ScenarioState>(initialState)
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null)
  const [isTimerActive, setIsTimerActive] = useState(true)
  const [decisionStartTime, setDecisionStartTime] = useState<number>(Date.now())
  const [sessionPaused, setSessionPaused] = useState(session.is_paused)
  const [timePressure, setTimePressure] = useState(0)

  // Update current state when state manager changes
  useEffect(() => {
    setCurrentState(stateManager.getCurrentState())
  }, [stateManager])

  // Handle timer updates and pressure calculation
  useEffect(() => {
    if (!isTimerActive || sessionPaused || !currentState.timeLimit) return

    const interval = setInterval(() => {
      const elapsed = Date.now() - decisionStartTime
      const pressure = stateManager.getTimePressure(elapsed)
      setTimePressure(pressure)

      // Auto-submit if time runs out
      if (pressure >= 1 && selectedDecision) {
        handleDecisionSubmit(selectedDecision, true)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isTimerActive, sessionPaused, decisionStartTime, currentState.timeLimit, selectedDecision])

  const handleDecisionSelect = useCallback((decision: Decision) => {
    setSelectedDecision(decision)
  }, [])

  const handleDecisionSubmit = useCallback(async (decision: Decision, isTimeout = false) => {
    if (!stateManager.isValidDecision(decision.id)) return

    const timeTaken = Date.now() - decisionStartTime
    
    // Create session decision record
    const sessionDecision: SessionDecision = {
      id: crypto.randomUUID(),
      session_id: session.id,
      state_id: currentState.id,
      decision_text: decision.text,
      timestamp: new Date().toISOString(),
      time_taken_ms: timeTaken,
      score_impact: 0, // Will be calculated by scoring engine
      consequences: decision.consequences,
      user_confidence: isTimeout ? 0.3 : 0.8 // Lower confidence for timeout decisions
    }

    // Record decision in state manager
    stateManager.recordDecision(decision)

    // Notify parent component
    onDecisionMade(sessionDecision)

    // Check if this leads to a terminal state
    if (stateManager.isTerminalState()) {
      setIsTimerActive(false)
      // Calculate final score and complete session
      const finalScore = calculateSessionScore()
      onSessionComplete(finalScore)
      return
    }

    // Reset for next decision
    setSelectedDecision(null)
    setDecisionStartTime(Date.now())
    setTimePressure(0)
    
    // Update current state for next decision
    setCurrentState(stateManager.getCurrentState())
  }, [stateManager, currentState, session, decisionStartTime, onDecisionMade, onSessionComplete])

  const handlePauseSession = useCallback(() => {
    setSessionPaused(true)
    setIsTimerActive(false)
    onSessionPause()
  }, [onSessionPause])

  const handleResumeSession = useCallback(() => {
    setSessionPaused(false)
    setIsTimerActive(true)
    setDecisionStartTime(Date.now()) // Reset timer
    onSessionResume()
  }, [onSessionResume])

  const calculateSessionScore = (): number => {
    // Basic scoring calculation - will be enhanced by scoring engine
    const decisions = stateManager.getDecisionHistory()
    const totalImpact = decisions.reduce((sum, decision) => {
      return sum + decision.consequences.reduce((impactSum, consequence) => {
        return impactSum + consequence.impact_score
      }, 0)
    }, 0)
    
    return Math.max(0, Math.min(100, totalImpact))
  }

  const decisionContext = stateManager.getDecisionContext()
  const availableDecisions = stateManager.getAvailableDecisions()
  const stateHistory = stateManager.getStateHistory()
  const decisionHistory = stateManager.getDecisionHistory()

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header with progress and controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <ProgressTracker
            stateHistory={stateHistory}
            decisionHistory={decisionHistory}
            currentState={currentState}
          />
          
          <div className="flex items-center gap-4">
            {currentState.timeLimit && (
              <DecisionTimer
                timeLimit={currentState.timeLimit}
                timePressure={timePressure}
                isActive={isTimerActive && !sessionPaused}
                onTimeout={() => selectedDecision && handleDecisionSubmit(selectedDecision, true)}
              />
            )}
            
            <div className="flex gap-2">
              {sessionPaused ? (
                <button
                  onClick={handleResumeSession}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Resume
                </button>
              ) : (
                <button
                  onClick={handlePauseSession}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                >
                  Pause
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Context */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          <ContextPanel
            state={currentState}
            context={decisionContext}
            timePressure={timePressure}
          />
        </div>

        {/* Center panel - Decisions */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          <DecisionPanel
            decisions={availableDecisions}
            selectedDecision={selectedDecision}
            onDecisionSelect={handleDecisionSelect}
            onDecisionSubmit={handleDecisionSubmit}
            timePressure={timePressure}
            disabled={sessionPaused}
          />
        </div>

        {/* Right panel - Visualizations */}
        <div className="w-1/3 overflow-y-auto">
          <VisualizationPanel
            stateHistory={stateHistory}
            decisionHistory={decisionHistory}
            currentState={currentState}
            timePressure={timePressure}
          />
        </div>
      </div>

      {/* Session paused overlay */}
      {sessionPaused && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-4">Session Paused</h2>
            <p className="text-gray-600 mb-6">Your progress has been saved. Click resume to continue.</p>
            <button
              onClick={handleResumeSession}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Resume Session
            </button>
          </div>
        </div>
      )}
    </div>
  )
}