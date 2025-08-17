import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '../../../lib/supabase'
import { TrainingSessionManager } from '../../../lib/session-manager'
import { isAuthenticated } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient()
    const { user, error: authError } = await isAuthenticated(supabase)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionManager = new TrainingSessionManager(supabase)
    const sessions = await sessionManager.getActiveSessions(user.id)

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient()
    const { user, error: authError } = await isAuthenticated(supabase)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { scenarioId, configuration, scenarioConfig } = body

    if (!scenarioId || !configuration || !scenarioConfig) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const sessionManager = new TrainingSessionManager(supabase)
    const result = await sessionManager.startSession(
      user.id,
      scenarioId,
      configuration,
      scenarioConfig
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ sessionId: result.sessionId })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}