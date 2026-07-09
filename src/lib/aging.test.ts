import { describe, expect, it } from 'vitest'
import {
  AGING_DEACTIVATE_DAYS,
  AGING_IDLE_DAYS,
  AGING_REMINDER_DAYS,
  computeAging,
} from '@/lib/aging'
import type { Project } from '@/types'

function projectAt(status: Project['status'], lastActivityAt: string): Project {
  return {
    id: 'prj-age',
    title: 'Aging test',
    submitterId: 'usr-submitter',
    sponsorId: null,
    businessAnalystId: null,
    dataEngineerId: null,
    programManagerId: null,
    maintenanceOwnerId: null,
    operations: null,
    group: 'Engineering',
    site: 'Cebu',
    department: 'Test',
    status,
    currentStage: 'Development',
    stageStatus: {
      Assessment: 'Completed',
      Policy: 'NotStarted',
      SupplierOversight: 'NotStarted',
      Development: 'InProgress',
      Deployment: 'NotStarted',
      Use: 'NotStarted',
      Improvement: 'NotStarted',
      Decommissioning: 'NotStarted',
      Enablement: 'NotStarted',
    },
    submission: {
      useCase: 'x',
      problem: 'p',
      goal: 'g',
      targetUsers: 't',
      expectedOutcome: 'o',
      dataSources: 'd',
      dataSensitivity: 'Internal',
      dataAccessStatus: 'Available',
      skillLevelAvailable: 'Intermediate',
      existingTools: [],
      integrationTargets: [],
      estimatedUsers: 1,
      expectedBenefitHours: 1,
    },
    recommendations: [],
    alternativeRecommendations: [],
    recommendedComboIds: [],
    toolStack: [],
    createdAt: lastActivityAt,
    updatedAt: lastActivityAt,
    auditLog: [],
    reportedBenefitHours: null,
    sponsorValidated: false,
    intakeMode: 'manual',
    tier: 'Tier1',
    tierRationale: '',
    autoTiered: false,
    rewardCategory: null,
    ehsCoordinatorId: null,
    qualification: null,
    readiness: null,
    requirements: null,
    uat: null,
    activeSince: lastActivityAt,
    lastActivityAt,
    sponsorDecision: null,
    sponsorDecisionNote: '',
    agingMilestone: 'none',
  }
}

describe('computeAging', () => {
  const now = new Date('2026-06-20T08:00:00Z')

  function daysAgoIso(n: number): string {
    return new Date(now.getTime() - n * 86400000).toISOString()
  }

  it('13d Active → reminder (not idle-due)', () => {
    const result = computeAging(projectAt('Active', daysAgoIso(13)), now)
    expect(result.daysInactive).toBe(13)
    expect(result.phase).toBe('reminder')
    expect(result.daysInactive).toBeGreaterThanOrEqual(AGING_REMINDER_DAYS)
    expect(result.daysInactive).toBeLessThan(AGING_IDLE_DAYS)
  })

  it('14d Active → idle-due', () => {
    const result = computeAging(projectAt('Active', daysAgoIso(14)), now)
    expect(result.phase).toBe('idle')
    expect(result.daysInactive).toBe(AGING_IDLE_DAYS)
  })

  it('187d Idle → deactivated-due', () => {
    const result = computeAging(projectAt('Idle', daysAgoIso(AGING_DEACTIVATE_DAYS)), now)
    expect(result.phase).toBe('deactivated')
  })

  it('non-Active/Idle returns n/a active phase', () => {
    const result = computeAging(projectAt('Completed', daysAgoIso(200)), now)
    expect(result.phase).toBe('active')
    expect(result.daysInactive).toBe(0)
  })
})
