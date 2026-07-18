import { describe, it, expect } from 'vitest'
import { calculateOptimalRoute, STADIUM_GRAPH } from './graphEngine'

describe('Routing Engine', () => {
  it('should contain standard stadium nodes', () => {
    expect(STADIUM_GRAPH).toHaveProperty('GATE_A')
    expect(STADIUM_GRAPH).toHaveProperty('GATE_B')
    expect(STADIUM_GRAPH).toHaveProperty('MEDICAL_1')
  })

  it('calculateOptimalRoute should return a valid route object', () => {
    const route = calculateOptimalRoute('GATE_A', 'MEDICAL_1')
    expect(route).toBeDefined()
    expect(route.path).toBeInstanceOf(Array)
    expect(route.totalTime).toBeGreaterThan(0)
  })
})
