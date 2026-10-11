import { describe, expect, it } from 'vitest'
import { admissionTierForRefreshReason } from './pr-refresh-candidate-policy'

describe('admissionTierForRefreshReason', () => {
  it.each(['manual', 'post-push'] as const)(
    'runs %s refreshes at interactive priority',
    (reason) => {
      expect(admissionTierForRefreshReason(reason)).toBe('interactive')
    }
  )

  it.each(['visible', 'active', 'swr'] as const)('keeps %s polling in the background', (reason) => {
    expect(admissionTierForRefreshReason(reason)).toBe('background')
  })
})
