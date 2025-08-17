// API routes for user configuration management
import { NextRequest, NextResponse } from 'next/server'
import { ConfigurationManager } from '../../../lib/config/config-manager'
import { createServerComponentClient } from '../../../lib/supabase'
import { isAuthenticated } from '../../../lib/supabase'

// GET /api/config - Get user configuration
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient()
    const { user, error: authError } = await isAuthenticated(supabase)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const configManager = new ConfigurationManager(supabase)
    const configuration = await configManager.getUserConfiguration(user.id)

    return NextResponse.json({ configuration })
  } catch (error) {
    console.error('Error getting user configuration:', error)
    return NextResponse.json(
      { error: 'Failed to get configuration' },
      { status: 500 }
    )
  }
}

// PUT /api/config - Update user configuration
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerComponentClient()
    const { user, error: authError } = await isAuthenticated(supabase)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const configManager = new ConfigurationManager(supabase)

    // Validate the update payload
    const validation = configManager.validateConfiguration(body)
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid configuration', 
          details: validation.errors,
          warnings: validation.warnings 
        },
        { status: 400 }
      )
    }

    const updatedConfiguration = await configManager.updateUserConfiguration(user.id, body)

    return NextResponse.json({ 
      configuration: updatedConfiguration,
      message: 'Configuration updated successfully'
    })
  } catch (error) {
    console.error('Error updating user configuration:', error)
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
}

// POST /api/config/reset - Reset user configuration to defaults
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient()
    const { user, error: authError } = await isAuthenticated(supabase)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const configManager = new ConfigurationManager(supabase)
    const defaultConfiguration = await configManager.resetUserConfiguration(user.id)

    return NextResponse.json({ 
      configuration: defaultConfiguration,
      message: 'Configuration reset to defaults'
    })
  } catch (error) {
    console.error('Error resetting user configuration:', error)
    return NextResponse.json(
      { error: 'Failed to reset configuration' },
      { status: 500 }
    )
  }
}