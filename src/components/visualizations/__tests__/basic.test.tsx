import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'

// Simple smoke tests for visualization components
describe('Visualization Components', () => {
  // Mock D3 to prevent DOM manipulation during tests
  beforeAll(() => {
    jest.mock('d3', () => ({
      select: jest.fn(() => ({
        selectAll: jest.fn(() => ({ remove: jest.fn() }))
      }))
    }))
  })

  it('can import visualization components without errors', () => {
    expect(() => {
      require('../DecisionTreeViz')
      require('../OutcomeTimelineViz') 
      require('../RiskExposureChart')
      require('../index')
    }).not.toThrow()
  })

  it('visualization demo component can be imported', () => {
    expect(() => {
      require('../VisualizationDemo')
    }).not.toThrow()
  })
})