'use client'

import { useState, useEffect } from 'react'
import { ConfigurationManager } from '../../lib/config/config-manager'
import { createClientComponentClient } from '../../lib/supabase'
import type { UserConfiguration, UserPreferences, ConfigurationUpdatePayload } from '../../lib/config/types'
import { DomainSelector } from './domain-selector'
import { JobRoleSelector } from './job-role-selector'
import { RiskProfileSelector } from './risk-profile-selector'
import { PreferencesForm } from './preferences-form'

interface ConfigurationFormProps {
  userId: string
  initialConfig?: UserConfiguration
  onConfigurationChange?: (config: UserConfiguration) => void
  onSave?: (config: UserConfiguration) => void
  showPreferences?: boolean
  className?: string
}

export function ConfigurationForm({
  userId,
  initialConfig,
  onConfigurationChange,
  onSave,
  showPreferences = true,
  className = ''
}: ConfigurationFormProps) {
  const [configuration, setConfiguration] = useState<UserConfiguration | null>(initialConfig || null)
  const [loading, setLoading] = useState(!initialConfig)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const supabase = createClientComponentClient()
  const configManager = new ConfigurationManager(supabase)

  // Load configuration if not provided
  useEffect(() => {
    if (!initialConfig && userId) {
      loadConfiguration()
    }
  }, [userId, initialConfig])

  const loadConfiguration = async () => {
    try {
      setLoading(true)
      setError(null)
      const config = await configManager.getUserConfiguration(userId)
      setConfiguration(config)
      onConfigurationChange?.(config)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleConfigurationUpdate = async (updates: ConfigurationUpdatePayload) => {
    if (!configuration) return

    try {
      setError(null)
      setValidationErrors([])

      // Create updated configuration
      const updatedConfig: UserConfiguration = {
        ...configuration,
        ...updates,
        preferences: updates.preferences 
          ? { ...configuration.preferences, ...updates.preferences } as UserPreferences
          : configuration.preferences
      }

      // Validate configuration
      const validation = configManager.validateConfiguration(updatedConfig)
      if (!validation.isValid) {
        setValidationErrors(validation.errors)
        return
      }

      setConfiguration(updatedConfig)
      onConfigurationChange?.(updatedConfig)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update configuration')
    }
  }

  const handleSave = async () => {
    if (!configuration) return

    try {
      setSaving(true)
      setError(null)
      
      await configManager.saveUserConfiguration(userId, configuration)
      onSave?.(configuration)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const defaultConfig = await configManager.resetUserConfiguration(userId)
      setConfiguration(defaultConfig)
      onConfigurationChange?.(defaultConfig)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset configuration')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading configuration...</span>
      </div>
    )
  }

  if (!configuration) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <p className="text-gray-600">Failed to load configuration</p>
        <button 
          onClick={loadConfiguration}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h4 className="text-yellow-800 font-medium mb-2">Configuration Issues:</h4>
          <ul className="text-yellow-700 text-sm space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DomainSelector
          selectedDomain={configuration.domain}
          onDomainChange={(domain) => handleConfigurationUpdate({ domain })}
          configManager={configManager}
        />

        <JobRoleSelector
          selectedDomain={configuration.domain}
          selectedJobRole={configuration.jobRole}
          onJobRoleChange={(jobRole) => handleConfigurationUpdate({ jobRole })}
          configManager={configManager}
        />

        <RiskProfileSelector
          selectedDomain={configuration.domain}
          selectedJobRole={configuration.jobRole}
          selectedRiskProfile={configuration.riskProfile}
          onRiskProfileChange={(riskProfile) => handleConfigurationUpdate({ riskProfile })}
          configManager={configManager}
        />
      </div>

      {showPreferences && (
        <PreferencesForm
          preferences={configuration.preferences}
          onPreferencesChange={(preferences) => handleConfigurationUpdate({ preferences })}
        />
      )}

      <div className="flex justify-between items-center pt-6 border-t">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          disabled={saving}
        >
          Reset to Defaults
        </button>

        <div className="space-x-3">
          <button
            onClick={handleSave}
            disabled={saving || validationErrors.length > 0}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  )
}