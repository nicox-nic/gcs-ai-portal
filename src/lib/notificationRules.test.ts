import { describe, expect, it } from 'vitest'
import { SEED_PROJECTS } from '@/data/seedProjects'
import { recipientsFor } from '@/lib/notificationRules'
import type { Project } from '@/types'

function baseProject(overrides?: Partial<Project>): Project {
  const seed = SEED_PROJECTS[0]
  return { ...seed, ...overrides }
}

describe('recipientsFor (Phase 9–10)', () => {
  it('puts assigned Sponsor on TO for completed and disapproved', () => {
    const project = baseProject({ sponsorId: 'usr-sponsor', submitterId: 'usr-submitter' })
    for (const kind of ['completed', 'disapproved'] as const) {
      const { to, cc } = recipientsFor(kind, project)
      expect(to).toContain('usr-sponsor')
      expect(cc).not.toContain('usr-sponsor')
    }
  })

  it('includes MaintenanceSustainability on aging notification TO', () => {
    const project = baseProject({ maintenanceOwnerId: null })
    const { to } = recipientsFor('aging-idle', project)
    expect(to).toContain('usr-maint')
  })

  it('prefers assigned DE on development-started and requirements-confirmed', () => {
    const project = baseProject({ dataEngineerId: 'usr-data' })
    expect(recipientsFor('development-started', project).to).toEqual(['usr-data'])
    expect(recipientsFor('requirements-confirmed', project).to).toEqual(['usr-data'])
  })

  it('falls back to role-wide DE when unassigned', () => {
    const project = baseProject({ dataEngineerId: null })
    expect(recipientsFor('development-started', project).to).toContain('usr-data')
  })

  it('go-live TO is assigned M&S owner when set', () => {
    const project = baseProject({ maintenanceOwnerId: 'usr-maint' })
    expect(recipientsFor('go-live', project).to).toEqual(['usr-maint'])
  })

  it('uat-signed-off TO prefers assigned PM and DE', () => {
    const project = baseProject({
      dataEngineerId: 'usr-data',
      programManagerId: 'usr-pm',
    })
    const { to } = recipientsFor('uat-signed-off', project)
    expect(to).toContain('usr-data')
    expect(to).toContain('usr-pm')
  })
})
