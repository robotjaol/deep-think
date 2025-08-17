import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '../../../../lib/supabase'
import { TrainingSessionManager, SessionPersistence } from '../../../../lib/session-manager'
import { isAuthenticated } from '../../../../lib/supabase'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const params = await context.params
  try {
    const supabase = createServerComponentClient()
    const { user, error: authError } = await isAuthenticated(supabase)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionManager = new TrainingSessionManager(supabase)
    const metrics = await sessionManager.getSessionMetrics()

    if (!metrics) {
      return NextResponse.json(
        { error: 'Session not found or not active' },
        { status: 404 }
      )
    }

    return NextResponse.json({ metrics })
  } catch (error) {
    console.error('Error fetching session metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const params = await context.params
  try {
    const supabase = createServerComponentClient()
    const { user, error: authError } = await isAuthenticated(supabase)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...data } = body

    const sessionManager = new TrainingSessionManager(supabase)

    switch (action) {
      case 'pause':
        const pauseResult = await sessionManager.pauseSession()
        if (!pauseResult.success) {
          return NextResponse.json(
            { error: pauseResult.error },
            { status: 400 }
          )
        }
        return NextResponse.json({ success: true })

      case 'resume':
        const { scenarioConfig } = data
        if (!scenarioConfig) {
          return NextResponse.json(
            { error: 'Scenario config required for resume' },
            { status: 400 }
          )
        }
        const resumeResult = await sessionManager.resumeSession(params.sessionId, scenarioConfig)
        if (!resumeResult.success) {
          return NextResponse.json(
            { error: resumeResult.error },
            { status: 400 }
          )
        }
        return NextResponse.json({ success: true })

      case 'complete':
        const { finalScore } = data
        if (typeof finalScore !== 'number') {
          return NextResponse.json(
            { error: 'Final score required for completion' },
            { status: 400 }
          )
        }
        const completeResult = await sessionManager.completeSession(finalScore)
        if (!completeResult.success) {
          return NextResponse.json(
            { error: completeResult.error },
            { status: 400 }
          )
        }
        return NextResponse.json({ success: true })

      case 'update_state':
        const { newStateId } = data
        if (!newStateId) {
          return NextResponse.json(
            { error: 'New state ID required' },
            { status: 400 }
          )
        }
        const updateResult = await sessionManager.updateCurrentState(newStateId)
        if (!updateResult.success) {
          return NextResponse.json(
            { error: updateResult.error },
            { status: 400 }
          )
        }
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}