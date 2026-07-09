import { describe, expect, it } from 'vitest'
import { SEED_PROJECTS } from '@/data/seedProjects'
import { SEED_TOOLS } from '@/data/seedTools'
import { PROJECT_STATUSES } from '@/lib/projectStatus'
import { computeDashboardStats } from '@/lib/dashboardStats'

describe('computeDashboardStats (V3 Phase 7)', () => {
  const stats = computeDashboardStats(SEED_PROJECTS, SEED_TOOLS)

  it('covers every operational status in the seed narrative', () => {
    const present = new Set(SEED_PROJECTS.map((p) => p.status))
    for (const status of PROJECT_STATUSES) {
      expect(present.has(status), `missing seed for ${status}`).toBe(true)
    }
  })

  it('exposes pending queues with deep-link hrefs', () => {
    expect(stats.queues.map((q) => q.key)).toEqual([
      'qualification',
      'ehs',
      'sponsor',
      'idle',
      'deactivated',
    ])
    expect(stats.pendingQualification).toBe(
      SEED_PROJECTS.filter((p) => p.status === 'ForAssessment').length,
    )
    expect(stats.pendingEhsReview).toBe(
      SEED_PROJECTS.filter((p) => p.status === 'ForEHSReview').length,
    )
    expect(stats.awaitingValidation).toBe(
      SEED_PROJECTS.filter((p) => p.status === 'ForSponsorApproval').length,
    )
    expect(stats.queues.find((q) => q.key === 'qualification')?.href).toBe(
      '/projects?status=ForAssessment',
    )
  })

  it('builds status pipeline and tier distribution', () => {
    expect(stats.statusPipeline).toHaveLength(PROJECT_STATUSES.length)
    expect(stats.tierDistribution.map((t) => t.tier)).toEqual(['Tier1', 'Tier2', 'Tier3'])
    const tieredCount = SEED_PROJECTS.filter((p) => p.tier !== null).length
    expect(stats.tierDistribution.reduce((sum, t) => sum + t.count, 0)).toBe(tieredCount)
  })

  it('excludes IdeaDraft / NotQualified / Cancelled from adoption numerators', () => {
    const excluded = new Set(['IdeaDraft', 'NotQualified', 'Cancelled'])
    const expected = SEED_PROJECTS.filter(
      (p) => p.group === 'Engineering' && !excluded.has(p.status),
    ).length
    const row = stats.adoptionByGroup.find((r) => r.group === 'Engineering')
    expect(row?.numerator).toBe(expected)
  })

  it('counts Tier3 as highRiskProjects and Idle/Blocked as needsAttention', () => {
    expect(stats.highRiskProjects).toBe(
      SEED_PROJECTS.filter((p) => p.tier === 'Tier3').length,
    )
    expect(stats.needsAttention).toBe(
      SEED_PROJECTS.filter(
        (p) =>
          p.status === 'Idle' ||
          Object.values(p.stageStatus).some((status) => status === 'Blocked'),
      ).length,
    )
  })

  it('scopes DE/PM/M&S queues to the assigned user', () => {
    const scoped = computeDashboardStats(SEED_PROJECTS, SEED_TOOLS, {
      currentUserId: 'usr-data',
    })
    expect(scoped.deDevelopmentQueue).toBe(
      SEED_PROJECTS.filter(
        (p) =>
          p.dataEngineerId === 'usr-data' &&
          p.status === 'Active' &&
          p.currentStage === 'Development',
      ).length,
    )
    const pmScoped = computeDashboardStats(SEED_PROJECTS, SEED_TOOLS, {
      currentUserId: 'usr-pm',
    })
    expect(pmScoped.pmReviewQueue).toBe(
      SEED_PROJECTS.filter((p) => p.status === 'Submitted').length,
    )
    expect(pmScoped.pmDeploymentQueue).toBe(
      SEED_PROJECTS.filter(
        (p) =>
          p.programManagerId === 'usr-pm' &&
          p.status === 'Active' &&
          p.currentStage === 'Deployment',
      ).length,
    )
    const msScoped = computeDashboardStats(SEED_PROJECTS, SEED_TOOLS, {
      currentUserId: 'usr-maint',
    })
    expect(msScoped.msActiveQueue).toBe(
      SEED_PROJECTS.filter(
        (p) => p.maintenanceOwnerId === 'usr-maint' && p.status === 'Active',
      ).length,
    )
  })
})
