import { describe, it, expect } from 'vitest'
import { STADIUM_FACTS } from './stadiumFacts'

describe('Stadium Facts', () => {
  it('should contain information about MetLife stadium', () => {
    expect(STADIUM_FACTS).toContain('MetLife Stadium')
  })

  it('should list all major gates', () => {
    expect(STADIUM_FACTS).toContain('Gate A')
    expect(STADIUM_FACTS).toContain('Gate B')
    expect(STADIUM_FACTS).toContain('Gate C')
    expect(STADIUM_FACTS).toContain('Gate D')
  })
})
