'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { ScoreResult, SessionDecision } from '@/lib/types'

interface RiskMetric {
  category: string
  currentLevel: number
  maxLevel: number
  trend: 'increasing' | 'decreasing' | 'stable'
  color: string
  description: string
}

interface RiskDataPoint {
  timestamp: Date
  overallRisk: number
  financialRisk: number
  operationalRisk: number
  reputationalRisk: number
  complianceRisk: number
}

interface RiskExposureChartProps {
  currentRiskMetrics: RiskMetric[]
  riskHistory: RiskDataPoint[]
  decisions: SessionDecision[]
  scoreResult?: ScoreResult
  className?: string
  width?: number
  height?: number
  showRealTime?: boolean
}

export const RiskExposureChart: React.FC<RiskExposureChartProps> = ({
  currentRiskMetrics,
  riskHistory,
  decisions,
  scoreResult,
  className = '',
  width = 600,
  height = 400,
  showRealTime = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width, height })
  const [viewMode, setViewMode] = useState<'gauge' | 'timeline'>('gauge')

  // Responsive handling
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const container = svgRef.current.parentElement
        if (container) {
          const containerWidth = container.clientWidth
          const containerHeight = Math.max(300, containerWidth * 0.6)
          setDimensions({
            width: Math.min(containerWidth, width),
            height: Math.min(containerHeight, height)
          })
        }
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [width, height])

  // Calculate overall risk level
  const calculateOverallRisk = (): number => {
    if (currentRiskMetrics.length === 0) return 0
    const totalRisk = currentRiskMetrics.reduce((sum, metric) => 
      sum + (metric.currentLevel / metric.maxLevel), 0
    )
    return (totalRisk / currentRiskMetrics.length) * 100
  }

  // Render gauge view
  const renderGaugeView = () => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width: w, height: h } = dimensions
    const centerX = w / 2
    const centerY = h / 2
    const radius = Math.min(w, h) / 3

    const g = svg.append('g')
      .attr('transform', `translate(${centerX}, ${centerY})`)

    // Create gauge background
    const gaugeBackground = g.append('path')
      .datum({ startAngle: -Math.PI / 2, endAngle: Math.PI / 2 })
      .attr('d', d3.arc<any>()
        .innerRadius(radius - 20)
        .outerRadius(radius)
      )
      .attr('class', 'fill-gray-200')

    // Create risk level arcs
    const riskLevels = [
      { level: 33, color: '#10b981', label: 'Low' },
      { level: 66, color: '#f59e0b', label: 'Medium' },
      { level: 100, color: '#ef4444', label: 'High' }
    ]

    const angleScale = d3.scaleLinear()
      .domain([0, 100])
      .range([-Math.PI / 2, Math.PI / 2])

    riskLevels.forEach((level, index) => {
      const startAngle = index === 0 ? -Math.PI / 2 : angleScale(riskLevels[index - 1].level)
      const endAngle = angleScale(level.level)

      g.append('path')
        .datum({ startAngle, endAngle })
        .attr('d', d3.arc<any>()
          .innerRadius(radius - 15)
          .outerRadius(radius - 5)
        )
        .style('fill', level.color)
        .style('opacity', 0.3)
    })

    // Add risk level labels
    riskLevels.forEach((level, index) => {
      const angle = angleScale(level.level - (index === 0 ? 16.5 : 16.5))
      const labelRadius = radius + 15
      
      g.append('text')
        .attr('x', Math.cos(angle) * labelRadius)
        .attr('y', Math.sin(angle) * labelRadius)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('class', 'text-xs font-medium')
        .style('fill', level.color)
        .text(level.label)
    })

    // Calculate current risk level
    const overallRisk = calculateOverallRisk()
    const needleAngle = angleScale(overallRisk)

    // Add needle
    const needleLength = radius - 10
    g.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', Math.cos(needleAngle) * needleLength)
      .attr('y2', Math.sin(needleAngle) * needleLength)
      .attr('class', 'stroke-gray-800 stroke-3')
      .style('stroke-linecap', 'round')

    // Add center circle
    g.append('circle')
      .attr('r', 8)
      .attr('class', 'fill-gray-800')

    // Add current risk value
    g.append('text')
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-2xl font-bold')
      .style('fill', overallRisk > 66 ? '#ef4444' : overallRisk > 33 ? '#f59e0b' : '#10b981')
      .text(`${Math.round(overallRisk)}%`)

    g.append('text')
      .attr('y', 60)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-sm text-gray-600')
      .text('Overall Risk')

    // Add individual risk metrics
    const metricsGroup = svg.append('g')
      .attr('transform', `translate(20, ${h - 120})`)

    currentRiskMetrics.forEach((metric, index) => {
      const metricGroup = metricsGroup.append('g')
        .attr('transform', `translate(0, ${index * 25})`)

      // Risk category label
      metricGroup.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('class', 'text-sm font-medium fill-gray-700')
        .text(metric.category)

      // Risk level bar
      const barWidth = 100
      const barHeight = 8
      
      metricGroup.append('rect')
        .attr('x', 120)
        .attr('y', -4)
        .attr('width', barWidth)
        .attr('height', barHeight)
        .attr('class', 'fill-gray-200 rounded')

      metricGroup.append('rect')
        .attr('x', 120)
        .attr('y', -4)
        .attr('width', (metric.currentLevel / metric.maxLevel) * barWidth)
        .attr('height', barHeight)
        .style('fill', metric.color)
        .attr('class', 'rounded')

      // Risk level text
      metricGroup.append('text')
        .attr('x', 230)
        .attr('y', 0)
        .attr('class', 'text-sm fill-gray-600')
        .text(`${Math.round((metric.currentLevel / metric.maxLevel) * 100)}%`)

      // Trend indicator
      const trendSymbol = metric.trend === 'increasing' ? '↗' : 
                         metric.trend === 'decreasing' ? '↘' : '→'
      const trendColor = metric.trend === 'increasing' ? '#ef4444' : 
                        metric.trend === 'decreasing' ? '#10b981' : '#6b7280'

      metricGroup.append('text')
        .attr('x', 260)
        .attr('y', 0)
        .attr('class', 'text-sm')
        .style('fill', trendColor)
        .text(trendSymbol)
    })
  }

  // Render timeline view
  const renderTimelineView = () => {
    if (!svgRef.current || riskHistory.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width: w, height: h } = dimensions
    const margin = { top: 20, right: 40, bottom: 40, left: 60 }
    const innerWidth = w - margin.left - margin.right
    const innerHeight = h - margin.top - margin.bottom

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(riskHistory, d => d.timestamp) as [Date, Date])
      .range([0, innerWidth])

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0])

    // Create line generator
    const line = d3.line<RiskDataPoint>()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.overallRisk))
      .curve(d3.curveMonotoneX)

    // Add axes
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%H:%M') as any))

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`))

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-innerHeight)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3)

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3)

    // Add risk zones
    const riskZones = [
      { start: 0, end: 33, color: '#10b981', opacity: 0.1, label: 'Low Risk' },
      { start: 33, end: 66, color: '#f59e0b', opacity: 0.1, label: 'Medium Risk' },
      { start: 66, end: 100, color: '#ef4444', opacity: 0.1, label: 'High Risk' }
    ]

    riskZones.forEach(zone => {
      g.append('rect')
        .attr('x', 0)
        .attr('y', yScale(zone.end))
        .attr('width', innerWidth)
        .attr('height', yScale(zone.start) - yScale(zone.end))
        .style('fill', zone.color)
        .style('opacity', zone.opacity)
    })

    // Add overall risk line
    g.append('path')
      .datum(riskHistory)
      .attr('d', line)
      .attr('class', 'stroke-2 fill-none')
      .style('stroke', '#374151')

    // Add data points
    g.selectAll('.risk-point')
      .data(riskHistory)
      .enter().append('circle')
      .attr('class', 'risk-point')
      .attr('cx', d => xScale(d.timestamp))
      .attr('cy', d => yScale(d.overallRisk))
      .attr('r', 4)
      .style('fill', d => d.overallRisk > 66 ? '#ef4444' : d.overallRisk > 33 ? '#f59e0b' : '#10b981')
      .style('stroke', 'white')
      .style('stroke-width', 2)

    // Add decision markers
    decisions.forEach(decision => {
      const decisionTime = new Date(decision.timestamp)
      const x = xScale(decisionTime)
      
      g.append('line')
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('class', 'stroke-blue-500 stroke-1 stroke-dasharray-4')

      g.append('text')
        .attr('x', x)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-xs fill-blue-600')
        .text('D')
    })

    // Add labels
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 35)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-sm fill-gray-700')
      .text('Time')

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-sm fill-gray-700')
      .text('Risk Level (%)')
  }

  useEffect(() => {
    if (viewMode === 'gauge') {
      renderGaugeView()
    } else {
      renderTimelineView()
    }
  }, [currentRiskMetrics, riskHistory, decisions, dimensions, viewMode])

  return (
    <div className={`relative ${className}`}>
      {/* View mode toggle */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white rounded-lg shadow-md border p-1 flex">
          <button
            onClick={() => setViewMode('gauge')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'gauge' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Gauge
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'timeline' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Timeline
          </button>
        </div>
      </div>

      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="border border-gray-200 rounded-lg bg-white"
      />

      {/* Real-time indicator */}
      {showRealTime && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-white px-3 py-1 rounded-lg shadow-md border">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live</span>
        </div>
      )}

      {/* Risk summary */}
      {scoreResult && (
        <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-md border text-sm max-w-xs">
          <div className="font-semibold mb-1">Risk Management Score</div>
          <div className="text-lg font-bold text-blue-600">
            {Math.round(scoreResult.riskManagement)}/100
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Based on {decisions.length} decisions
          </div>
        </div>
      )}
    </div>
  )
}

export default RiskExposureChart