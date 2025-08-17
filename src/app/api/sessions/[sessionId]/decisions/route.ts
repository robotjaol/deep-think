import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '../../../../../lib/supabase'
import { TrainingSessionManager } from '../../../../../lib/session-manager'
import { isAuthenticated } from '../../../../../lib/supabase'

export async function POST(
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
    const {
      stateId,
      decisionText,
      timeTakenMs,
      scoreImpact,
      consequences,
      userConfidence
    } = body

    // Validate required fields
    if (!stateId || !decisionText || typeof timeTakenMs !== 'number' || typeof scoreImpact !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: stateId, decisionText, timeTakenMs, scoreImpact' },
        { status: 400 }
      )
    }

    if (!Array.isArray(consequences)) {
      return NextResponse.json(
        { error: 'Consequences must be an array' },
        { status: 400 }
      )
    }

    if (userConfidence !== undefined && (userConfidence < 1 || userConfidence > 5)) {
      return NextResponse.json(
        { error: 'User confidence must be between 1 and 5' },
        { status: 400 }
      )
    }

    const sessionManager = new TrainingSessionManager(supabase)
    const result = await sessionManager.recordDecision(
      stateId,
      decisionText,
      timeTakenMs,
      scoreImpact,
      consequences,
      userConfidence
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error recording decision:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    // Get decisions for the session
    const { data: decisions, error } = await supabase
      .from('decisions')
      .select('*')
      .eq('session_id', params.sessionId)
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('Error fetching decisions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch decisions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ decisions: decisions || [] })
  } catch (error) {
    console.error('Error fetching decisions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}