'use client'

import { useState, useEffect } from 'react'
import type { ConfigurationManager } from '../../lib/config/config-manager'
import type { RiskProfile } from '../../lib/types'

interface RiskProfileSelectorProps {
  selectedDomain?: string
  selectedJobRole?: string
  selectedRiskProfile?: RiskProfile
  onRiskProfileChange: (riskProfile: RiskProfile) => void
  configManager: ConfigurationManager
  className?: string
}

const RISK_PROFILE_DESCRIPTIONS = {
  conservative: {
    title: 'Conservative',
    description: 'Prefer cautious, well-established approaches with minimal risk',
    characteristics: ['Risk-averse', 'Methodical', 'Compliance-focused', 'Thorough analysis']
  },
  balanced: {
    title: 'Balanced',
    description: 'Balance risk and reward with measured decision-making',
    characteristics: ['Pragmatic', 'Flexible', 'Evidence-based', 'Calculated risks']
  },
  aggressive: {
    title: 'Aggressive',
    description: 'Willing to take bold actions and accept higher risks for potential gains',
    characteristics: ['Bold', 'Quick decisions', 'Innovation-focused', 'High-risk tolerance']
  }
}

export function RiskProfileSelector({
  selectedDomain,
  selectedJobRole,
  selectedRiskProfile,
  onRiskProfileChange,
  configManager,
  className = ''
}: RiskProfileSelectorProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [compatibleProfiles, setCompatibleProfiles] = useState<RiskProfile[]>([])

  useEffect(() => {
    if (selectedDomain && selectedJobRole) {
      const profiles = configManager.getRiskProfilesForJobRole(selectedDomain, selectedJobRole)
      setCompatibleProfiles(profiles)
      
      // Reset risk profile if current selection is not compatible
      if (selectedRiskProfile && !profiles.includes(selectedRiskProfile)) {
        onRiskProfileChange(profiles[0] || 'balanced')
      }
    } else {
      setCompatibleProfiles(['conservative', 'balanced', 'aggressive'])
    }
  }, [selectedDomain, selectedJobRole, selectedRiskProfile, onRiskProfileChange, configManager])

  const handleRiskProfileSelect = (profile: RiskProfile) => {
    onRiskProfileChange(profile)
    setShowDetails(false)
  }

  const selectedProfileInfo = selectedRiskProfile ? RISK_PROFILE_DESCRIPTIONS[selectedRiskProfile] : null

  if (!selectedDomain || !selectedJobRole) {
    return (
      <div className={`space-y-3 ${className}`}>
        <label className="block text-sm font-medium text-gray-400">
          Risk Profile
        </label>
        <div className="block w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-400">
          Select domain and job role first
        </div>
        <p className="text-sm text-gray-400">
          Choose domain and job role to see compatible risk profiles
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Risk Profile
      </label>
      
      <div className="space-y-2">
        {compatibleProfiles.map((profile) => {
          const profileInfo = RISK_PROFILE_DESCRIPTIONS[profile]
          const isSelected = selectedRiskProfile === profile
          
          return (
            <div
              key={profile}
              className={`p-3 border rounded-md cursor-pointer transition-colors ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleRiskProfileSelect(profile)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="riskProfile"
                    value={profile}
                    checked={isSelected}
                    onChange={() => handleRiskProfileSelect(profile)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      {profileInfo.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {profileInfo.description}
                    </p>
                  </div>
                </div>
              </div>
              
              {isSelected && showDetails && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">
                    Key Characteristics:
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {profileInfo.characteristics.map((characteristic) => (
                      <span
                        key={characteristic}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700"
                      >
                        {characteristic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selectedProfileInfo && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Selected: <strong>{selectedProfileInfo.title}</strong>
          </span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-800"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        </div>
      )}

      {compatibleProfiles.length < 3 && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs text-yellow-800">
            Note: Some risk profiles are not compatible with the selected job role
          </p>
        </div>
      )}
    </div>
  )
}