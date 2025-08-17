'use client'

import { useState, useEffect } from 'react'
import type { ConfigurationManager } from '../../lib/config/config-manager'
import type { JobRoleConfig } from '../../lib/config/types'

interface JobRoleSelectorProps {
  selectedDomain?: string
  selectedJobRole?: string
  onJobRoleChange: (jobRole: string) => void
  configManager: ConfigurationManager
  className?: string
}

export function JobRoleSelector({
  selectedDomain,
  selectedJobRole,
  onJobRoleChange,
  configManager,
  className = ''
}: JobRoleSelectorProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [availableJobRoles, setAvailableJobRoles] = useState<JobRoleConfig[]>([])

  useEffect(() => {
    if (selectedDomain) {
      const jobRoles = configManager.getJobRolesForDomain(selectedDomain)
      setAvailableJobRoles(jobRoles)
      
      // Reset job role if current selection is not available in new domain
      if (selectedJobRole && !jobRoles.find(jr => jr.id === selectedJobRole)) {
        onJobRoleChange('')
      }
    } else {
      setAvailableJobRoles([])
      onJobRoleChange('')
    }
  }, [selectedDomain, selectedJobRole, onJobRoleChange, configManager])

  const selectedJobRoleConfig = availableJobRoles.find(jr => jr.id === selectedJobRole)

  const handleJobRoleSelect = (jobRoleId: string) => {
    onJobRoleChange(jobRoleId)
    setShowDetails(false)
  }

  if (!selectedDomain) {
    return (
      <div className={`space-y-3 ${className}`}>
        <label className="block text-sm font-medium text-gray-400">
          Job Role
        </label>
        <div className="block w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-400">
          Select a domain first
        </div>
        <p className="text-sm text-gray-400">
          Choose a domain to see available job roles
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Job Role
      </label>
      
      <div className="relative">
        <select
          value={selectedJobRole || ''}
          onChange={(e) => handleJobRoleSelect(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={availableJobRoles.length === 0}
        >
          <option value="">Select a job role...</option>
          {availableJobRoles.map((jobRole) => (
            <option key={jobRole.id} value={jobRole.id}>
              {jobRole.name}
            </option>
          ))}
        </select>
      </div>

      {selectedJobRoleConfig && (
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              {selectedJobRoleConfig.name}
            </h4>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mt-1">
            {selectedJobRoleConfig.description}
          </p>

          <div className="mt-2">
            <span className="text-xs text-gray-500">Compatible risk profiles: </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedJobRoleConfig.riskProfiles.map((profile) => (
                <span
                  key={profile}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                >
                  {profile}
                </span>
              ))}
            </div>
          </div>

          {showDetails && (
            <div className="mt-3 space-y-2">
              <div>
                <h5 className="text-xs font-medium text-gray-700">Key Responsibilities:</h5>
                <ul className="text-xs text-gray-600 mt-1 space-y-1">
                  {selectedJobRoleConfig.responsibilities.map((responsibility, index) => (
                    <li key={index}>• {responsibility}</li>
                  ))}
                </ul>
              </div>

              {selectedJobRoleConfig.requiredSkills && selectedJobRoleConfig.requiredSkills.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-gray-700">Required Skills:</h5>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedJobRoleConfig.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!selectedJobRole && availableJobRoles.length > 0 && (
        <p className="text-sm text-gray-500">
          Select your job role to get scenarios tailored to your responsibilities
        </p>
      )}
    </div>
  )
}