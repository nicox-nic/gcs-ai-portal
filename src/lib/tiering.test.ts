import { describe, expect, it } from 'vitest'
import { canOwnStack, getStackOwnerRoles } from '@/lib/tiering'
import type { Project, User } from '@/types'

function baseProject(overrides?: Partial<Project>): Project {
  return {
    id: 'prj-test',
    title: 'Test',
    submitterId: 'usr-submitter',
    sponsorId: null,
    businessAnalystId: null,
    dataEngineerId: null,
    programManagerId: null,
    maintenanceOwnerId: null,
    operations: null,
    verification: null,
    usesExternalVendor: false,
    vendorSaq: null,
    group: 'Engineering',
    site: 'Cebu',
    department: 'Test',
    status: 'Active',
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
    createdAt: '',
    updatedAt: '',
    auditLog: [],
    reportedBenefitHours: null,
    sponsorValidated: false,
    intakeMode: 'manual',
    tier: null,
    tierRationale: '',
    autoTiered: false,
    rewardCategory: null,
    ehsCoordinatorId: null,
    qualification: null,
    readiness: null,
    requirements: null,
    uat: null,
    activeSince: null,
    lastActivityAt: '',
    sponsorDecision: null,
    sponsorDecisionNote: '',
    ...overrides,
  }
}

function user(partial: Pick<User, 'id' | 'role'>): User {
  return {
    id: partial.id,
    displayName: partial.id,
    role: partial.role,
    group: 'Engineering',
    site: 'Cebu',
    department: 'Test',
  }
}

describe('tiering canOwnStack', () => {
  it('Tier1 includes the project submitter', () => {
    const project = baseProject({ tier: 'Tier1' })
    expect(canOwnStack(project, user({ id: 'usr-submitter', role: 'Submitter' }))).toBe(true)
    expect(getStackOwnerRoles('Tier1')).toContain('Submitter')
  })

  it('Tier3 excludes a bare submitter', () => {
    const project = baseProject({ tier: 'Tier3' })
    expect(canOwnStack(project, user({ id: 'usr-submitter', role: 'Submitter' }))).toBe(false)
    expect(canOwnStack(project, user({ id: 'usr-pm', role: 'AIProgramManager' }))).toBe(true)
    expect(getStackOwnerRoles('Tier3')).not.toContain('Submitter')
  })

  it('Tier2 is collaborative (DE / PM / BA)', () => {
    const project = baseProject({ tier: 'Tier2' })
    expect(canOwnStack(project, user({ id: 'usr-data', role: 'DataEngineering' }))).toBe(true)
    expect(canOwnStack(project, user({ id: 'usr-ba', role: 'BusinessAnalyst' }))).toBe(true)
    expect(canOwnStack(project, user({ id: 'usr-submitter', role: 'Submitter' }))).toBe(false)
  })
})
