'use client'

import { useState } from 'react'
import type { UserPreferences } from '../../lib/config/types'
import { DEFAULT_USER_PREFERENCES } from '../../lib/config/defaults'

interface PreferencesFormProps {
  preferences?: UserPreferences
  onPreferencesChange: (preferences: Partial<UserPreferences>) => void
  className?: string
}

export function PreferencesForm({
  preferences = DEFAULT_USER_PREFERENCES,
  onPreferencesChange,
  className = ''
}: PreferencesFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    onPreferencesChange({ [key]: value })
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Training Preferences</h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scenario Complexity */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Scenario Complexity
          </label>
          <div className="space-y-2">
            {[
              { value: 'simple', label: 'Simple', description: 'Straightforward scenarios with clear choices' },
              { value: 'moderate', label: 'Moderate', description: 'Balanced complexity with multiple factors' },
              { value: 'complex', label: 'Complex', description: 'Multi-layered scenarios with ambiguous outcomes' }
            ].map((option) => (
              <div key={option.value} className="flex items-start">
                <input
                  type="radio"
                  name="scenarioComplexity"
                  value={option.value}
                  checked={preferences.scenarioComplexity === option.value}
                  onChange={(e) => handlePreferenceChange('scenarioComplexity', e.target.value)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-3">
                  <label className="text-sm font-medium text-gray-900">
                    {option.label}
                  </label>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time Constraints */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Time Pressure
          </label>
          <div className="space-y-2">
            {[
              { value: 'relaxed', label: 'Relaxed', description: 'Generous time limits for thoughtful decisions' },
              { value: 'moderate', label: 'Moderate', description: 'Realistic time pressure for most scenarios' },
              { value: 'strict', label: 'Strict', description: 'High time pressure for rapid decision training' }
            ].map((option) => (
              <div key={option.value} className="flex items-start">
                <input
                  type="radio"
                  name="timeConstraints"
                  value={option.value}
                  checked={preferences.timeConstraints === option.value}
                  onChange={(e) => handlePreferenceChange('timeConstraints', e.target.value)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-3">
                  <label className="text-sm font-medium text-gray-900">
                    {option.label}
                  </label>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Detail */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Feedback Detail Level
          </label>
          <div className="space-y-2">
            {[
              { value: 'brief', label: 'Brief', description: 'Quick summary of key points' },
              { value: 'detailed', label: 'Detailed', description: 'Thorough analysis with explanations' },
              { value: 'comprehensive', label: 'Comprehensive', description: 'In-depth feedback with resources' }
            ].map((option) => (
              <div key={option.value} className="flex items-start">
                <input
                  type="radio"
                  name="feedbackDetail"
                  value={option.value}
                  checked={preferences.feedbackDetail === option.value}
                  onChange={(e) => handlePreferenceChange('feedbackDetail', e.target.value)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-3">
                  <label className="text-sm font-medium text-gray-900">
                    {option.label}
                  </label>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Toggle Options */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Interface Options
          </label>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">
                  Visualizations
                </label>
                <p className="text-sm text-gray-600">Show decision trees and outcome charts</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.visualizations}
                onChange={(e) => handlePreferenceChange('visualizations', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            {showAdvanced && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      Notifications
                    </label>
                    <p className="text-sm text-gray-600">Receive training reminders and updates</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.notifications}
                    onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      Auto-save Progress
                    </label>
                    <p className="text-sm text-gray-600">Automatically save scenario progress</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.autoSave}
                    onChange={(e) => handlePreferenceChange('autoSave', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}