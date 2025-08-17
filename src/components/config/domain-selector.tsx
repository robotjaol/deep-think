'use client'

import { useState } from 'react'
import type { ConfigurationManager } from '../../lib/config/config-manager'
import type { DomainConfig } from '../../lib/config/types'

interface DomainSelectorProps {
  selectedDomain?: string
  onDomainChange: (domain: string) => void
  configManager: ConfigurationManager
  className?: string
}

export function DomainSelector({
  selectedDomain,
  onDomainChange,
  configManager,
  className = ''
}: DomainSelectorProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  const availableDomains = configManager.getAvailableDomains()
  const selectedDomainConfig = availableDomains.find(d => d.id === selectedDomain)

  const handleDomainSelect = (domainId: string) => {
    onDomainChange(domainId)
    setShowDetails(false)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Domain
      </label>
      
      <div className="relative">
        <select
          value={selectedDomain || ''}
          onChange={(e) => handleDomainSelect(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a domain...</option>
          {availableDomains.map((domain) => (
            <option key={domain.id} value={domain.id}>
              {domain.name}
            </option>
          ))}
        </select>
      </div>

      {selectedDomainConfig && (
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              {selectedDomainConfig.name}
            </h4>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mt-1">
            {selectedDomainConfig.description}
          </p>

          {selectedDomainConfig.requiredExperience && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Requires: {selectedDomainConfig.requiredExperience} level
              </span>
            </div>
          )}

          {showDetails && (
            <div className="mt-3 space-y-2">
              <div>
                <h5 className="text-xs font-medium text-gray-700">Available Roles:</h5>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedDomainConfig.jobRoles.map((role) => (
                    <span
                      key={role.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                    >
                      {role.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!selectedDomain && (
        <p className="text-sm text-gray-500">
          Choose your professional domain to get relevant crisis scenarios
        </p>
      )}
    </div>
  )
}