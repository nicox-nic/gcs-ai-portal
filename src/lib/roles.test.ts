import { describe, expect, it } from 'vitest'
import { SUBMIT_ROLES } from '@/lib/roles'

describe('SUBMIT_ROLES (Phase 9)', () => {
  it('includes DE, PM, and M&S alongside Submitter, BA, and Admin', () => {
    expect(SUBMIT_ROLES).toEqual([
      'Submitter',
      'BusinessAnalyst',
      'DataEngineering',
      'AIProgramManager',
      'MaintenanceSustainability',
      'Admin',
    ])
  })

  it('excludes gate and oversight roles that must not submit', () => {
    for (const role of [
      'Sponsor',
      'EHS',
      'GovernanceLead',
      'RiskCompliance',
    ] as const) {
      expect(SUBMIT_ROLES.includes(role)).toBe(false)
    }
  })
})
