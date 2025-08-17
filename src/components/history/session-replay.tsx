'use client'

import { useState, useEffect } from 'react'
import { TrainingSession, SessionDecision, ScenarioConfig } from '@/lib/types'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'
import { format } from 'date-fns'

// Extended type for history view that includes scenario data
export interface TrainingSessionWithScenario extends TrainingSession {
  scenarios?: {
    title: string
    domain: string
    difficulty_level: number
  } | null
}

interface SessionReplayProps {
  session: TrainingSessionWithScenario
  decisions: SessionDecision[]
  loading: boolean
  error: string | null
}

interface ReplayState {
  currentStep: number
  isPlaying: boolean
  playbackSpeed: number
  scenarioConfig: ScenarioConfig | null
}

export function SessionReplay({ session, decisions, loading, error }: SessionReplayProps) {
  const [replayState, setReplayState] = useState<ReplayState>({
    currentStep: 0,
    isPlaying: false,
    playbackSpeed: 1,
    scenarioConfig: null
  })
  const [scenarioLoading, setScenarioLoading] = useState(true)
  const [scenarioError, setScenarioError] = useState<string | null>(null)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    if (session.scenario_id) {
      loadScenarioConfig()
    }
  }, [session.scenario_id])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (replayState.isPlaying && replayState.currentStep < decisions.length) {
      interval = setInterval(() => {
        setReplayState(prev => ({
          ...prev,
          currentStep: Math.min(prev.currentStep + 1, decisions.length)
        }))
      }, 2000 / replayState.playbackSpeed) // Base speed: 2 seconds per step
    } else if (replayState.currentStep >= decisions.length) {
      setReplayState(prev => ({ ...prev, isPlaying: false }))
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [replayState.isPlaying, replayState.currentStep, replayState.playbackSpeed, decisions.length])

  const loadScenarioConfig = async () => {
    try {
      setScenarioLoading(true)
      setScenarioError(null)

      const { data, error: fetchError } = await supabase
        .from('scenarios')
        .select('config')
        .eq('id', session.scenario_id)
        .single()

      if (fetchError) {
        throw fetchError
      }

      setReplayState(prev => ({
        ...prev,
        scenarioConfig: data.config as unknown as ScenarioConfig
      }))
    } catch (err) {
      console.error('Error loading scenario config:', err)
      setScenarioError(err instanceof Error ? err.message : 'Failed to load scenario configuration')
    } finally {
      setScenarioLoading(false)
    }
  }

  const handlePlay = () => {
    setReplayState(prev => ({ ...prev, isPlaying: true }))
  }

  const handlePause = () => {
    setReplayState(prev => ({ ...prev, isPlaying: false }))
  }

  const handleReset = () => {
    setReplayState(prev => ({
      ...prev,
      currentStep: 0,
      isPlaying: false
    }))
  }

  const handleStepForward = () => {
    setReplayState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, decisions.length),
      isPlaying: false
    }))
  }

  const handleStepBackward = () => {
    setReplayState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0),
      isPlaying: false
    }))
  }

  const handleSpeedChange = (speed: number) => {
    setReplayState(prev => ({ ...prev, playbackSpeed: speed }))
  }

  const handleSeek = (step: number) => {
    setReplayState(prev => ({
      ...prev,
      currentStep: step,
      isPlaying: false
    }))
  }

  const getCurrentScenarioState = () => {
    if (!replayState.scenarioConfig || replayState.currentStep === 0) {
      return replayState.scenarioConfig?.initialState
    }

    // Find the state based on the current decision
    const currentDecision = decisions[replayState.currentStep - 1]
    if (!currentDecision) return replayState.scenarioConfig?.initialState

    // Look up the state from the scenario config
    return replayState.scenarioConfig?.states?.[currentDecision.state_id] || 
           replayState.scenarioConfig?.initialState
  }

  const getVisibleDecisions = () => {
    return decisions.slice(0, replayState.currentStep)
  }

  if (loading || scenarioLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div data-testid="loading-spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error || scenarioError) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">Error loading replay data</div>
          <p className="text-gray-600">{error || scenarioError}</p>
        </div>
      </div>
    )
  }

  if (decisions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4V8a3 3 0 013-3h6a3 3 0 013 3v2M7 21h10a2 2 0 002-2V9a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Replay Available</h3>
          <p className="text-gray-600">This session doesn&apos;t have enough data for replay functionality.</p>
        </div>
      </div>
    )
  }

  const currentState = getCurrentScenarioState()

  return (
    <div className="space-y-6">
      {/* Replay Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Session Replay</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Step {replayState.currentStep} of {decisions.length}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm text-gray-600">Progress:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${decisions.length > 0 ? (replayState.currentStep / decisions.length) * 100 : 0}%`
                }}
              />
            </div>
            <span className="text-sm text-gray-600">
              {decisions.length > 0 ? Math.round((replayState.currentStep / decisions.length) * 100) : 0}%
            </span>
          </div>

          {/* Timeline with clickable steps */}
          <div className="flex items-center space-x-1 mt-2">
            {decisions.map((_, index) => (
              <button
                key={index}
                onClick={() => handleSeek(index + 1)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index < replayState.currentStep
                    ? 'bg-blue-600'
                    : index === replayState.currentStep
                    ? 'bg-blue-400'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                title={`Go to decision ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <button
            onClick={handleReset}
            className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            title="Reset to beginning"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v6m0 0l4-4m-4 4L8 3m8 8a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <button
            onClick={handleStepBackward}
            disabled={replayState.currentStep === 0}
            className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            title="Step backward"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {replayState.isPlaying ? (
            <button
              onClick={handlePause}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700"
              title="Pause"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handlePlay}
              disabled={replayState.currentStep >= decisions.length}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Play"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4V8a3 3 0 013-3h6a3 3 0 013 3v2M7 21h10a2 2 0 002-2V9a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
          )}

          <button
            onClick={handleStepForward}
            disabled={replayState.currentStep >= decisions.length}
            className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            title="Step forward"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Playback Speed */}
        <div className="flex items-center justify-center space-x-2">
          <span className="text-sm text-gray-600">Speed:</span>
          {[0.5, 1, 1.5, 2].map(speed => (
            <button
              key={speed}
              onClick={() => handleSpeedChange(speed)}
              className={`px-3 py-1 text-sm rounded-md ${
                replayState.playbackSpeed === speed
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Current Scenario State */}
      {currentState && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Scenario State</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Situation:</h4>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{currentState.description}</p>
            </div>

            {currentState.context && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Context:</h4>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{currentState.context}</p>
              </div>
            )}

            {currentState.environmentalFactors && currentState.environmentalFactors.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Environmental Factors:</h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {currentState.environmentalFactors.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}

            {currentState.characters && currentState.characters.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Key Characters:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentState.characters.map((character, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium text-gray-900">{character.name}</div>
                      <div className="text-sm text-gray-600">{character.role}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Decision History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Decisions Made So Far</h3>
        
        {getVisibleDecisions().length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No decisions made yet. Use the controls above to step through the replay.
          </div>
        ) : (
          <div className="space-y-4">
            {getVisibleDecisions().map((decision, index) => (
              <div
                key={decision.id}
                className={`border rounded-lg p-4 ${
                  index === replayState.currentStep - 1
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    Decision {index + 1}
                    {index === replayState.currentStep - 1 && (
                      <span className="ml-2 text-sm text-blue-600">(Current)</span>
                    )}
                  </span>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{format(new Date(decision.timestamp), 'h:mm:ss a')}</span>
                    <span>•</span>
                    <span>{(decision.time_taken_ms / 1000).toFixed(1)}s</span>
                    <span>•</span>
                    <span className={`font-medium ${
                      decision.score_impact >= 80 ? 'text-green-600' :
                      decision.score_impact >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      Impact: {decision.score_impact.toFixed(1)}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700">{decision.decision_text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}