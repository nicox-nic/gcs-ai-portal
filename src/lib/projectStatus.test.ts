import { describe, expect, it } from 'vitest'
import {
  getAllowedStatusTransitions,
  PROJECT_STATUSES,
  STATUS_META,
} from '@/lib/projectStatus'
import type { ProjectStatus } from '@/types'

describe('projectStatus registry', () => {
  it('includes every ProjectStatus in STATUS_META', () => {
    for (const status of PROJECT_STATUSES) {
      expect(STATUS_META[status]).toBeDefined()
      expect(STATUS_META[status].label.length).toBeGreaterThan(0)
      expect(STATUS_META[status].variant.length).toBeGreaterThan(0)
    }
    expect(Object.keys(STATUS_META).sort()).toEqual([...PROJECT_STATUSES].sort())
  })

  it('has no dangling transition targets', () => {
    const known = new Set<ProjectStatus>(PROJECT_STATUSES)
    for (const status of PROJECT_STATUSES) {
      for (const target of getAllowedStatusTransitions(status)) {
        expect(known.has(target)).toBe(true)
      }
    }
  })

  it('returns [] for terminal states', () => {
    expect(getAllowedStatusTransitions('Completed')).toEqual([])
    expect(getAllowedStatusTransitions('Cancelled')).toEqual([])
  })

  it('allows Active → Cancelled', () => {
    expect(getAllowedStatusTransitions('Active')).toContain('Cancelled')
  })
})
