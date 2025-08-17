import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '../../../../lib/supabase'
import { SessionRecovery } from '../../../../lib/session-manager'
import { isAuthenticated } from '../../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient()
    const { user, error: authError } = await isAuthenticated(supabase)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const maxAgeHours = parseInt(url.searchParams.get('maxAgeHours') || '24')
    const includeCompleted = url.searchParams.get('includeCompleted') === 'true'
    const sortBy = (url.searchParams.get('sortBy') || 'recent') as 'recent' | 'progress' | 'time_spent'

    const sessionRecovery = new SessionRecovery(supabase)
    const recoverableSessions = await sessionRecovery.findRecoverableSessions(user.id, {
      maxAgeHours,
      includeCompleted,
      sortBy
    })

    return NextResponse.json({ sessions: recoverableSessions })
  } catch (error) {
    console.error('Error finding recoverable sessions:', error)
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
    const { action, sessionId, reason } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const sessionRecovery = new SessionRecovery(supabase)

    switch (action) {
      case 'check':
        const checkResult = await sessionRecovery.canRecoverSession(sessionId)
        return NextResponse.json(checkResult)

      case 'abandon':
        if (!reason) {
          return NextResponse.json(
            { error: 'Reason is required for abandoning session' },
            { status: 400 }
          )
        }
        const abandonResult = await sessionRecovery.abandonSession(sessionId, reason)
        if (!abandonResult.success) {
          return NextResponse.json(
            { error: abandonResult.error },
            { status: 400 }
          )
        }
        return NextResponse.json({ success: true })

      case 'cleanup':
        const maxAgeHours = parseInt(body.maxAgeHours || '168') // 7 days default
        const cleanupResult = await sessionRecovery.cleanupOldSessions(user.id, maxAgeHours)
        if (cleanupResult.error) {
          return NextResponse.json(
            { error: cleanupResult.error },
            { status: 400 }
          )
        }
        return NextResponse.json({ cleaned: cleanupResult.cleaned })

      case 'stats':
        const stats = await sessionRecovery.getRecoveryStats(user.id)
        return NextResponse.json({ stats })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing recovery request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}