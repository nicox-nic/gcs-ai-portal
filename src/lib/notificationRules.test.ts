import { describe, expect, it } from 'vitest'
import { SEED_PROJECTS } from '@/data/seedProjects'
import { recipientsFor } from '@/lib/notificationRules'
import type { Project } from '@/types'

function baseProject(overrides?: Partial<Project>): Project {
  const seed = SEED_PROJECTS[0]
  return { ...seed, ...overrides }
}

describe('recipientsFor (Phase 9)', () => {
  it('puts assigned Sponsor on TO for completed and disapproved', () => {
    const project = baseProject({ sponsorId: 'usr-sponsor', submitterId: 'usr-submitter' })
    for (const kind of ['completed', 'disapproved'] as const) {
      const { to, cc } = recipientsFor(kind, project)
      expect(to).toContain('usr-sponsor')
      expect(cc).not.toContain('usr-sponsor')
    }
  })

  it('includes MaintenanceSustainability on aging notification TO', () => {
    const project = baseProject()
    const { to } = recipientsFor('aging-idle', project)
    expect(to).toContain('usr-maint')
  })
})
