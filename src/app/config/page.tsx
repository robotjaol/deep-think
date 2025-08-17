'use client'

import { useState, useEffect } from 'react'
import { ConfigurationForm } from '../../components/config/configuration-form'
import { ConfigurationSummary } from '../../components/config/configuration-summary'
import type { UserConfiguration } from '../../lib/config/types'

export default function ConfigurationPage() {
  const [configuration, setConfiguration] = useState<UserConfiguration | null>(null)
  const [showSummary, setShowSummary] = useState(false)

  // Mock user ID for demonstration - in real app this would come from auth
  const mockUserId = 'demo-user-id'

  const handleConfigurationChange = (config: UserConfiguration) => {
    setConfiguration(config)
  }

  const handleSave = (config: UserConfiguration) => {
    setConfiguration(config)
    setShowSummary(true)
    // In real app, this would make API call to save configuration
    console.log('Configuration saved:', config)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Training Configuration
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Configure your crisis decision training parameters to get personalized scenarios
            </p>
          </div>

          <div className="p-6">
            <ConfigurationForm
              userId={mockUserId}
              onConfigurationChange={handleConfigurationChange}
              onSave={handleSave}
              showPreferences={true}
            />
          </div>

          {showSummary && configuration && (
            <div className="px-6 pb-6">
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Configuration Summary
                </h2>
                <ConfigurationSummary
                  configuration={configuration}
                  showPreferences={true}
                />
              </div>
            </div>
          )}
        </div>

        {/* Demo Information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Demo Information
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              This is a demonstration of the user configuration system for Deep-Think.
              The configuration includes:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Domain selection (Cybersecurity, Healthcare, Aerospace, Finance)</li>
              <li>Job role selection based on chosen domain</li>
              <li>Risk profile selection compatible with the job role</li>
              <li>Training preferences for scenario complexity and feedback</li>
            </ul>
            <p className="mt-4">
              The system validates configuration combinations to ensure compatibility
              and provides helpful suggestions when invalid combinations are selected.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}