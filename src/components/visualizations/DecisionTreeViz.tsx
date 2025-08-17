'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { Decision, ScenarioState, DecisionBranch } from '@/lib/types'

interface DecisionNode {
  id: string
  name: string
  type: 'state' | 'decision'
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
  children?: DecisionNode[]
  parent?: DecisionNode
  data?: ScenarioState | Decision
  riskLevel?: 'low' | 'medium' | 'high'
  isActive?: boolean
  isCompleted?: boolean
}

interface DecisionLink {
  source: DecisionNode
  target: DecisionNode
  type: 'decision' | 'outcome'
}

interface DecisionTreeVizProps {
  currentState: ScenarioState
  availableStates: Record<string, ScenarioState>
  branches: DecisionBranch[]
  completedDecisions: string[]
  currentDecisionPath: string[]
  onNodeClick?: (node: DecisionNode) => void
  className?: string
  width?: number
  height?: number
}

export const DecisionTreeViz: React.FC<DecisionTreeVizProps> = ({
  currentState,
  availableStates,
  branches,
  completedDecisions,
  currentDecisionPath,
  onNodeClick,
  className = '',
  width = 800,
  height = 600
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width, height })

  // Responsive handling
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const container = svgRef.current.parentElement
        if (container) {
          const containerWidth = container.clientWidth
          const containerHeight = Math.max(400, containerWidth * 0.6)
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

  // Build tree data structure
  const buildTreeData = (): { nodes: DecisionNode[], links: DecisionLink[] } => {
    const nodes: DecisionNode[] = []
    const links: DecisionLink[] = []
    const nodeMap = new Map<string, DecisionNode>()

    // Create root node for current state
    const rootNode: DecisionNode = {
      id: currentState.id,
      name: currentState.description.substring(0, 50) + '...',
      type: 'state',
      data: currentState,
      riskLevel: currentState.riskLevel,
      isActive: true
    }
    nodes.push(rootNode)
    nodeMap.set(currentState.id, rootNode)

    // Add decision nodes for current state
    currentState.decisions.forEach((decision, index) => {
      const decisionNode: DecisionNode = {
        id: `${currentState.id}-decision-${decision.id}`,
        name: decision.text.substring(0, 40) + '...',
        type: 'decision',
        data: decision,
        riskLevel: decision.riskLevel,
        isCompleted: completedDecisions.includes(decision.id),
        parent: rootNode
      }
      nodes.push(decisionNode)
      nodeMap.set(decisionNode.id, decisionNode)

      // Link state to decision
      links.push({
        source: rootNode,
        target: decisionNode,
        type: 'decision'
      })

      // Find and add outcome states
      const branch = branches.find(b => 
        b.fromStateId === currentState.id && b.decisionId === decision.id
      )
      
      if (branch && availableStates[branch.toStateId]) {
        const outcomeState = availableStates[branch.toStateId]
        const outcomeNode: DecisionNode = {
          id: outcomeState.id,
          name: outcomeState.description.substring(0, 50) + '...',
          type: 'state',
          data: outcomeState,
          riskLevel: outcomeState.riskLevel,
          isActive: currentDecisionPath.includes(outcomeState.id),
          parent: decisionNode
        }
        
        if (!nodeMap.has(outcomeNode.id)) {
          nodes.push(outcomeNode)
          nodeMap.set(outcomeNode.id, outcomeNode)
        }

        links.push({
          source: decisionNode,
          target: nodeMap.get(outcomeNode.id)!,
          type: 'outcome'
        })
      }
    })

    return { nodes, links }
  }

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { nodes, links } = buildTreeData()
    const { width: w, height: h } = dimensions

    // Create main group with zoom behavior
    const g = svg.append('g')
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    // Create force simulation
    const simulation = d3.forceSimulation<DecisionNode>(nodes)
      .force('link', d3.forceLink<DecisionNode, DecisionLink>(links)
        .id(d => d.id)
        .distance(100)
        .strength(0.8)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collision', d3.forceCollide().radius(40))

    // Create arrow markers
    const defs = svg.append('defs')
    
    const arrowMarker = defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')

    arrowMarker.append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('class', 'fill-gray-600')

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('class', (d) => 
        `stroke-2 ${d.type === 'decision' ? 'stroke-blue-500' : 'stroke-green-500'}`
      )
      .attr('marker-end', 'url(#arrow)')

    // Create nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'cursor-pointer')
      .call(d3.drag<SVGGElement, DecisionNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
      )

    // Add circles for nodes
    node.append('circle')
      .attr('r', (d) => d.type === 'state' ? 25 : 20)
      .attr('class', (d) => {
        const baseClass = 'stroke-2 '
        if (d.isActive) return baseClass + 'fill-yellow-200 stroke-yellow-600'
        if (d.isCompleted) return baseClass + 'fill-green-200 stroke-green-600'
        
        const riskColors = {
          low: 'fill-blue-100 stroke-blue-500',
          medium: 'fill-orange-100 stroke-orange-500',
          high: 'fill-red-100 stroke-red-500'
        }
        
        return baseClass + (riskColors[d.riskLevel || 'low'])
      })

    // Add labels
    node.append('text')
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('class', 'text-xs font-medium fill-gray-800 pointer-events-none')
      .text(d => d.name.length > 20 ? d.name.substring(0, 20) + '...' : d.name)
      .call(wrap, 40)

    // Add click handlers
    node.on('click', (event, d) => {
      event.stopPropagation()
      onNodeClick?.(d)
    })

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as DecisionNode).x || 0)
        .attr('y1', d => (d.source as DecisionNode).y || 0)
        .attr('x2', d => (d.target as DecisionNode).x || 0)
        .attr('y2', d => (d.target as DecisionNode).y || 0)

      node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`)
    })

    // Text wrapping function
    function wrap(text: d3.Selection<SVGTextElement, DecisionNode, SVGGElement, unknown>, width: number) {
      text.each(function(d) {
        const text = d3.select(this)
        const words = d.name.split(/\s+/).reverse()
        let word
        let line: string[] = []
        let lineNumber = 0
        const lineHeight = 1.1
        const y = text.attr('y') || 0
        const dy = parseFloat(text.attr('dy') || '0')
        let tspan = text.text(null).append('tspan').attr('x', 0).attr('y', y).attr('dy', dy + 'em')
        
        while (word = words.pop()) {
          line.push(word)
          tspan.text(line.join(' '))
          if (tspan.node()!.getComputedTextLength() > width) {
            line.pop()
            tspan.text(line.join(' '))
            line = [word]
            tspan = text.append('tspan').attr('x', 0).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word)
          }
        }
      })
    }

  }, [currentState, availableStates, branches, completedDecisions, currentDecisionPath, dimensions, onNodeClick])

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="border border-gray-200 rounded-lg bg-white"
      >
      </svg>
      
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md border text-sm">
        <div className="font-semibold mb-2">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-200 border-2 border-yellow-600"></div>
            <span>Current State</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-200 border-2 border-green-600"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-100 border-2 border-red-500"></div>
            <span>High Risk</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DecisionTreeViz