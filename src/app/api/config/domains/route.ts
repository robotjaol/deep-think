// API route for getting available domains and job roles
import { NextRequest, NextResponse } from 'next/server'
import { ConfigurationManager } from '../../../../lib/config/config-manager'
import { createServerComponentClient } from '../../../../lib/supabase'

// GET /api/config/domains - Get available domains and job roles
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient()
    const configManager = new ConfigurationManager(supabase)

    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get('domain')
    const jobRoleId = searchParams.get('jobRole')

    if (domainId && jobRoleId) {
      // Get risk profiles for specific job role
      const riskProfiles = configManager.getRiskProfilesForJobRole(domainId, jobRoleId)
      return NextResponse.json({ riskProfiles })
    } else if (domainId) {
      // Get job roles for specific domain
      const jobRoles = configManager.getJobRolesForDomain(domainId)
      return NextResponse.json({ jobRoles })
    } else {
      // Get all available domains
      const domains = configManager.getAvailableDomains()
      return NextResponse.json({ domains })
    }
  } catch (error) {
    console.error('Error getting domain configuration:', error)
    return NextResponse.json(
      { error: 'Failed to get domain configuration' },
      { status: 500 }
    )
  }
}