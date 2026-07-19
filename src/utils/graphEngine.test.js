import { describe, it, expect } from 'vitest'
import { calculateDynamicRoute, findNearestNodeOfType, STADIUM_GRAPH } from './graphEngine'

describe('Routing Engine', () => {
  it('should contain standard stadium nodes', () => {
    expect(STADIUM_GRAPH.nodes).toHaveProperty('GATE_A')
    expect(STADIUM_GRAPH.nodes).toHaveProperty('GATE_B')
    expect(STADIUM_GRAPH.nodes).toHaveProperty('MED_A')
  })

  it('calculateDynamicRoute should return a valid route object', () => {
    const route = calculateDynamicRoute(STADIUM_GRAPH, 'GATE_A', 'MED_A', [])
    expect(route).toBeDefined()
    expect(route.path).toBeInstanceOf(Array)
    expect(route.distance).toBeGreaterThan(0)
  })
  
  it('findNearestNodeOfType should find nearest node', () => {
    const result = findNearestNodeOfType(STADIUM_GRAPH, 'GATE_A', 'FIND_MEDICAL')
    expect(result.target).toBeDefined()
  })
})
