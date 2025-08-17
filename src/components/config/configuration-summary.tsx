'use client'

import type { UserConfiguration } from '../../lib/config/types'
import { AVAILABLE_DOMAINS } from '../../lib/config/defaults'

interface ConfigurationSummaryProps {
  configuration: UserConfiguration
  showPreferences?: boolean
  className?: string
}

export function ConfigurationSummary({
  configuration,
  showPreferences = false,
  className = ''
}: ConfigurationSummaryProps) {
  const domain = AVAILABLE_DOMAINS.find(d => d.id === configuration.domain)
  const jobRole = domain?.jobRoles.find(jr => jr.id === configuration.jobRole)

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration Summary</h3>
      
      <div className="space-y-4">
        {/* Domain */}
        <div>
          <dt className="text-sm font-medium text-gray-500">Domain</dt>
          <dd className="mt-1">
            <div className="flex items-center">
              <span className="text-sm text-gray-900">{domain?.name || configuration.domain}</span>
              {domain?.requiredExperience && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {domain.requiredExperience} level
                </span>
              )}
            </div>
            {domain?.description && (
              <p className="text-sm text-gray-600 mt-1">{domain.description}</p>
            )}
          </dd>
        </div>

        {/* Job Role */}
        <div>
          <dt className="text-sm font-medium text-gray-500">Job Role</dt>
          <dd className="mt-1">
            <span className="text-sm text-gray-900">{jobRole?.name || configuration.jobRole}</span>
            {jobRole?.description && (
              <p className="text-sm text-gray-600 mt-1">{jobRole.description}</p>
            )}
          </dd>
        </div>

        {/* Risk Profile */}
        <div>
          <dt className="text-sm font-medium text-gray-500">Risk Profile</dt>
          <dd className="mt-1">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
              configuration.riskProfile === 'conservative' 
                ? 'bg-green-100 text-green-800'
                : configuration.riskProfile === 'balanced'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {configuration.riskProfile.charAt(0).toUpperCase() + configuration.riskProfile.slice(1)}
            </span>
          </dd>
        </div>

        {/* Experience Level */}
        {configuration.experienceLevel && (
          <div>
            <dt className="text-sm font-medium text-gray-500">Experience Level</dt>
            <dd className="mt-1">
              <span className="text-sm text-gray-900 capitalize">
                {configuration.experienceLevel}
              </span>
            </dd>
          </div>
        )}

        {/* Preferences */}
        {showPreferences && configuration.preferences && (
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-2">Training Preferences</dt>
            <dd className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Complexity:</span>
                  <span className="ml-1 text-gray-900 capitalize">
                    {configuration.preferences.scenarioComplexity}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Time Pressure:</span>
                  <span className="ml-1 text-gray-900 capitalize">
                    {configuration.preferences.timeConstraints}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Feedback:</span>
                  <span className="ml-1 text-gray-900 capitalize">
                    {configuration.preferences.feedbackDetail}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Visualizations:</span>
                  <span className="ml-1 text-gray-900">
                    {configuration.preferences.visualizations ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </dd>
          </div>
        )}

        {/* Compatibility Info */}
        {jobRole && (
          <div className="pt-4 border-t border-gray-200">
            <dt className="text-sm font-medium text-gray-500 mb-2">Compatibility</dt>
            <dd>
              <div className="flex items-center">
                <span className="text-sm text-gray-600">Compatible risk profiles:</span>
                <div className="ml-2 flex flex-wrap gap-1">
                  {jobRole.riskProfiles.map((profile) => (
                    <span
                      key={profile}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        profile === configuration.riskProfile
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {profile}
                    </span>
                  ))}
                </div>
              </div>
            </dd>
          </div>
        )}
      </div>
    </div>
  )
}