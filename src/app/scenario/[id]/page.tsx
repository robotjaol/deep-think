'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ScenarioInterface } from '@/components/scenario'
import { ScenarioConfig, TrainingSession, SessionDecision, ScenarioState } from '@/lib/types'

// Mock data for development - will be replaced with actual API calls
const mockScenarioConfig: ScenarioConfig = {
  id: 'cyber-breach-001',
  title: 'Critical Data Breach Response',
  domain: 'cybersecurity',
  difficulty_level: 3,
  initialState: {
    id: 'initial-breach-detected',
    description: 'Your security monitoring system has detected unusual network activity. Multiple failed login attempts from foreign IP addresses are occurring simultaneously across different user accounts. The intrusion detection system is showing red alerts, and you notice encrypted files appearing in several directories.',
    context: 'It\'s 2:30 AM on a Friday night. You\'re the on-call security incident response manager for a financial services company. The automated monitoring system has woken you up with critical alerts. Your team is scattered across different time zones, and senior management needs to be informed of any significant security incidents.',
    decisions: [
      {
        id: 'immediate-lockdown',
        text: 'Immediately lock down all affected systems and disconnect from the network',
        riskLevel: 'low',
        nextStateId: 'systems-locked',
        consequences: [
          {
            id: 'lockdown-consequence-1',
            type: 'direct',
            description: 'All business operations halt, but breach is contained',
            impact_score: -10,
            probability: 0.95
          },
          {
            id: 'lockdown-consequence-2',
            type: 'second-order',
            description: 'Customer transactions fail, potential revenue loss',
            impact_score: -25,
            probability: 0.8,
            delay_minutes: 15
          }
        ]
      },
      {
        id: 'investigate-first',
        text: 'Keep systems running while conducting immediate investigation to assess scope',
        riskLevel: 'high',
        nextStateId: 'investigation-active',
        consequences: [
          {
            id: 'investigate-consequence-1',
            type: 'direct',
            description: 'Gather more intelligence about the attack',
            impact_score: 15,
            probability: 0.7
          },
          {
            id: 'investigate-consequence-2',
            type: 'second-order',
            description: 'Risk of data exfiltration continues during investigation',
            impact_score: -40,
            probability: 0.6,
            delay_minutes: 10
          }
        ]
      },
      {
        id: 'partial-isolation',
        text: 'Isolate only the most critical systems while monitoring others',
        riskLevel: 'medium',
        nextStateId: 'partial-containment',
        consequences: [
          {
            id: 'partial-consequence-1',
            type: 'direct',
            description: 'Balanced approach maintains some operations',
            impact_score: 5,
            probability: 0.8
          },
          {
            id: 'partial-consequence-2',
            type: 'second-order',
            description: 'May miss lateral movement in non-isolated systems',
            impact_score: -15,
            probability: 0.4,
            delay_minutes: 20
          }
        ]
      }
    ],
    timeLimit: 180, // 3 minutes
    environmentalFactors: [
      'Off-hours incident with limited staff availability',
      'Financial services regulatory requirements for incident reporting',
      'Customer-facing systems currently processing transactions',
      'Backup systems are operational but not fully tested under load'
    ],
    characters: [
      {
        id: 'sarah-cto',
        name: 'Sarah Chen',
        role: 'Chief Technology Officer',
        personality_traits: ['analytical', 'risk-averse', 'detail-oriented'],
        communication_style: 'Direct and technical',
        expertise_areas: ['system architecture', 'business continuity', 'regulatory compliance']
      },
      {
        id: 'mike-security',
        name: 'Mike Rodriguez',
        role: 'Senior Security Analyst',
        personality_traits: ['proactive', 'thorough', 'collaborative'],
        communication_style: 'Methodical and precise',
        expertise_areas: ['threat analysis', 'incident response', 'forensics']
      }
    ],
    riskLevel: 'high',
    criticalityScore: 85
  },
  states: {},
  branches: [],
  is_active: true,
  created_at: new Date().toISOString(),
  version: '1.0.0',
  tags: ['cybersecurity', 'incident-response', 'data-breach']
}

const mockSession: TrainingSession = {
  id: 'session-001',
  user_id: 'user-123',
  scenario_id: 'cyber-breach-001',
  configuration: {
    domain: 'cybersecurity',
    jobRole: 'Security Manager',
    riskProfile: 'balanced',
    scenarioHistory: []
  },
  started_at: new Date().toISOString(),
  session_data: {
    decisions_made: [],
    state_history: ['initial-breach-detected'],
    time_spent_seconds: 0,
    pause_count: 0,
    hints_used: 0,
    current_context: {}
  },
  current_state_id: 'initial-breach-detected',
  is_paused: false
}

export default function ScenarioPage() {
  const params = useParams()
  const router = useRouter()
  const [session, setSession] = useState<TrainingSession>(mockSession)
  const [scenario, setScenario] = useState<ScenarioConfig>(mockScenarioConfig)
  const [loading, setLoading] = useState(false)

  // In a real implementation, this would fetch the scenario and session data
  useEffect(() => {
    const scenarioId = params.id as string
    // TODO: Fetch scenario and session data from API
    console.log('Loading scenario:', scenarioId)
  }, [params.id])

  const handleDecisionMade = async (decision: SessionDecision) => {
    console.log('Decision made:', decision)
    
    // Update session with new decision
    setSession(prev => ({
      ...prev,
      session_data: {
        ...prev.session_data,
        decisions_made: [...prev.session_data.decisions_made, decision],
        time_spent_seconds: prev.session_data.time_spent_seconds + Math.floor(decision.time_taken_ms / 1000)
      }
    }))

    // TODO: Send decision to API for processing and state transition
    // TODO: Update scenario state based on decision outcome
  }

  const handleSessionComplete = async (finalScore: number) => {
    console.log('Session completed with score:', finalScore)
    
    // Update session as completed
    setSession(prev => ({
      ...prev,
      completed_at: new Date().toISOString(),
      final_score: finalScore
    }))

    // TODO: Save final session data to API
    // Redirect to results page
    router.push(`/scenario/results?sessionId=${session.id}`)
  }

  const handleSessionPause = async () => {
    console.log('Session paused')
    
    setSession(prev => ({
      ...prev,
      is_paused: true,
      session_data: {
        ...prev.session_data,
        pause_count: prev.session_data.pause_count + 1
      }
    }))

    // TODO: Save session state to API
  }

  const handleSessionResume = async () => {
    console.log('Session resumed')
    
    setSession(prev => ({
      ...prev,
      is_paused: false
    }))

    // TODO: Update session state in API
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading scenario...</p>
        </div>
      </div>
    )
  }

  return (
    <ScenarioInterface
      session={session}
      initialState={scenario.initialState}
      onDecisionMade={handleDecisionMade}
      onSessionComplete={handleSessionComplete}
      onSessionPause={handleSessionPause}
      onSessionResume={handleSessionResume}
    />
  )
}