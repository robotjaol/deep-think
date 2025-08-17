'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { SessionDecision, Consequence } from '@/lib/types'

interface TimelineEvent {
  id: string
  timestamp: Date
  type: 'decision' | 'consequence' | 'milestone'
  title: string
  description: string
  impact: number
  riskLevel: 'low' | 'medium' | 'high'
  category: string
  delay?: number
}

interface OutcomeTimelineVizProps {
  decisions: SessionDecision[]
  startTime: Date
  currentTime?: Date
  className?: string
  width?: number
  height?: number
  showFutureEvents?: boolean
}

export const OutcomeTimelineViz: React.FC<OutcomeTimelineVizProps> = ({
  decisions,
  startTime,
  currentTime = new Date(),
  className = '',
  width = 800,
  height = 400,
  showFutureEvents = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width, height })
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)

  // Responsive handling
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const container = svgRef.current.parentElement
        if (container) {
          const containerWidth = container.clientWidth
          const containerHeight = Math.max(300, containerWidth * 0.4)
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

  // Process decisions into timeline events
  const processTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = []

    decisions.forEach((decision) => {
      // Add decision event
      const decisionEvent: TimelineEvent = {
        id: `decision-${decision.id}`,
        timestamp: new Date(decision.timestamp),
        type: 'decision',
        title: 'Decision Made',
        description: decision.decision_text,
        impact: decision.score_impact,
        riskLevel: decision.score_impact < 0 ? 'high' : decision.score_impact > 50 ? 'low' : 'medium',
        category: 'action'
      }
      events.push(decisionEvent)

      // Add consequence events
      decision.consequences.forEach((consequence, index) => {
        const consequenceTime = new Date(decision.timestamp)
        if (consequence.delay_minutes) {
          consequenceTime.setMinutes(consequenceTime.getMinutes() + consequence.delay_minutes)
        }

        const consequenceEvent: TimelineEvent = {
          id: `consequence-${decision.id}-${index}`,
          timestamp: consequenceTime,
          type: 'consequence',
          title: consequence.type === 'direct' ? 'Immediate Effect' : 'Secondary Effect',
          description: consequence.description,
          impact: consequence.impact_score,
          riskLevel: consequence.impact_score < -20 ? 'high' : consequence.impact_score > 20 ? 'low' : 'medium',
          category: consequence.type,
          delay: consequence.delay_minutes
        }
        events.push(consequenceEvent)
      })
    })

    // Sort events by timestamp
    return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const events = processTimelineEvents()
    if (events.length === 0) return

    const { width: w, height: h } = dimensions
    const margin = { top: 40, right: 40, bottom: 60, left: 60 }
    const innerWidth = w - margin.left - margin.right
    const innerHeight = h - margin.top - margin.bottom

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Create scales
    const timeExtent = d3.extent([startTime, ...events.map(e => e.timestamp), currentTime]) as [Date, Date]
    const xScale = d3.scaleTime()
      .domain(timeExtent)
      .range([0, innerWidth])

    const yScale = d3.scaleOrdinal()
      .domain(['decision', 'consequence', 'milestone'])
      .range([innerHeight * 0.2, innerHeight * 0.5, innerHeight * 0.8])

    // Create axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.timeFormat('%H:%M') as any)
      .ticks(6)

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .attr('class', 'fill-gray-700 text-sm font-medium')
      .text('Time')

    // Create timeline line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', innerHeight / 2)
      .attr('y2', innerHeight / 2)
      .attr('class', 'stroke-gray-300 stroke-2')

    // Current time indicator
    const currentTimeX = xScale(currentTime)
    g.append('line')
      .attr('x1', currentTimeX)
      .attr('x2', currentTimeX)
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('class', 'stroke-blue-500 stroke-2 stroke-dasharray-4')

    g.append('text')
      .attr('x', currentTimeX)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('class', 'fill-blue-600 text-xs font-medium')
      .text('Now')

    // Color scales for different event types and risk levels
    const riskColorScale = d3.scaleOrdinal<string>()
      .domain(['low', 'medium', 'high'])
      .range(['#10b981', '#f59e0b', '#ef4444'])

    const typeShapeScale = d3.scaleOrdinal<string>()
      .domain(['decision', 'consequence', 'milestone'])
      .range(['circle', 'square', 'diamond'])

    // Create event groups
    const eventGroups = g.selectAll('.event-group')
      .data(events)
      .enter().append('g')
      .attr('class', 'event-group cursor-pointer')
      .attr('transform', d => `translate(${xScale(d.timestamp)}, ${yScale(d.type)})`)

    // Add event shapes
    eventGroups.each(function(d) {
      const group = d3.select(this)
      const color = riskColorScale(d.riskLevel)
      const isFuture = d.timestamp > currentTime

      if (d.type === 'decision') {
        group.append('circle')
          .attr('r', 8)
          .attr('class', `fill-current stroke-2 stroke-white ${isFuture && !showFutureEvents ? 'opacity-30' : ''}`)
          .style('fill', color)
      } else if (d.type === 'consequence') {
        group.append('rect')
          .attr('x', -6)
          .attr('y', -6)
          .attr('width', 12)
          .attr('height', 12)
          .attr('class', `fill-current stroke-2 stroke-white ${isFuture && !showFutureEvents ? 'opacity-30' : ''}`)
          .style('fill', color)
      } else {
        // Diamond shape for milestones
        group.append('path')
          .attr('d', 'M0,-8 L8,0 L0,8 L-8,0 Z')
          .attr('class', `fill-current stroke-2 stroke-white ${isFuture && !showFutureEvents ? 'opacity-30' : ''}`)
          .style('fill', color)
      }
    })

    // Add connecting lines for consequences
    events.forEach((event, index) => {
      if (event.type === 'consequence' && event.delay && event.delay > 0) {
        // Find the related decision
        const decisionId = event.id.split('-')[1]
        const relatedDecision = events.find(e => e.id === `decision-${decisionId}`)
        
        if (relatedDecision) {
          g.append('line')
            .attr('x1', xScale(relatedDecision.timestamp))
            .attr('y1', yScale(relatedDecision.type) as number)
            .attr('x2', xScale(event.timestamp))
            .attr('y2', yScale(event.type) as number)
            .attr('class', 'stroke-gray-400 stroke-1 stroke-dasharray-2')
        }
      }
    })

    // Add impact indicators
    eventGroups.append('text')
      .attr('dy', -15)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-xs font-bold')
      .style('fill', d => d.impact >= 0 ? '#10b981' : '#ef4444')
      .text(d => d.impact >= 0 ? `+${d.impact}` : d.impact.toString())

    // Add hover and click interactions
    eventGroups
      .on('mouseover', function(event, d) {
        d3.select(this).select('circle, rect, path')
          .transition()
          .duration(200)
          .attr('transform', 'scale(1.3)')

        // Show tooltip
        const tooltip = d3.select('body').append('div')
          .attr('class', 'absolute bg-gray-800 text-white p-2 rounded shadow-lg text-sm z-50 pointer-events-none')
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')

        tooltip.html(`
          <div class="font-semibold">${d.title}</div>
          <div class="text-gray-300">${d.description}</div>
          <div class="text-xs mt-1">
            Impact: <span class="${d.impact >= 0 ? 'text-green-400' : 'text-red-400'}">${d.impact}</span>
          </div>
          <div class="text-xs">Time: ${d3.timeFormat('%H:%M:%S')(d.timestamp)}</div>
        `)
      })
      .on('mouseout', function() {
        d3.select(this).select('circle, rect, path')
          .transition()
          .duration(200)
          .attr('transform', 'scale(1)')

        d3.selectAll('.tooltip').remove()
        d3.select('body').selectAll('div').filter(function() {
          return d3.select(this).classed('absolute') && d3.select(this).classed('bg-gray-800')
        }).remove()
      })
      .on('click', (event, d) => {
        setSelectedEvent(selectedEvent?.id === d.id ? null : d)
      })

    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${innerWidth - 150}, 20)`)

    const legendData = [
      { type: 'decision', label: 'Decision', shape: 'circle' },
      { type: 'consequence', label: 'Consequence', shape: 'square' },
      { type: 'milestone', label: 'Milestone', shape: 'diamond' }
    ]

    const legendItems = legend.selectAll('.legend-item')
      .data(legendData)
      .enter().append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`)

    legendItems.each(function(d) {
      const item = d3.select(this)
      
      if (d.shape === 'circle') {
        item.append('circle').attr('r', 6).attr('cx', 8).attr('cy', 0)
      } else if (d.shape === 'square') {
        item.append('rect').attr('x', 2).attr('y', -6).attr('width', 12).attr('height', 12)
      } else {
        item.append('path').attr('d', 'M8,-6 L14,0 L8,6 L2,0 Z')
      }
      
      item.select('circle, rect, path')
        .attr('class', 'fill-gray-400 stroke-white stroke-1')

      item.append('text')
        .attr('x', 20)
        .attr('y', 0)
        .attr('dy', '0.35em')
        .attr('class', 'text-xs fill-gray-600')
        .text(d.label)
    })

  }, [decisions, startTime, currentTime, dimensions, showFutureEvents])

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="border border-gray-200 rounded-lg bg-white"
      />
      
      {/* Event details panel */}
      {selectedEvent && (
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <p className="text-gray-700 mb-2">{selectedEvent.description}</p>
          <div className="text-sm space-y-1">
            <div>
              <span className="font-medium">Impact:</span>
              <span className={`ml-1 ${selectedEvent.impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {selectedEvent.impact >= 0 ? '+' : ''}{selectedEvent.impact}
              </span>
            </div>
            <div>
              <span className="font-medium">Time:</span>
              <span className="ml-1">{d3.timeFormat('%H:%M:%S')(selectedEvent.timestamp)}</span>
            </div>
            <div>
              <span className="font-medium">Risk Level:</span>
              <span className={`ml-1 capitalize ${
                selectedEvent.riskLevel === 'high' ? 'text-red-600' :
                selectedEvent.riskLevel === 'medium' ? 'text-orange-600' : 'text-green-600'
              }`}>
                {selectedEvent.riskLevel}
              </span>
            </div>
            {selectedEvent.delay && (
              <div>
                <span className="font-medium">Delay:</span>
                <span className="ml-1">{selectedEvent.delay} minutes</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default OutcomeTimelineViz