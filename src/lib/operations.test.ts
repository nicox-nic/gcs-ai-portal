import { describe, expect, it } from 'vitest'
import {
  canOperate,
  deriveHealth,
  emptyOperations,
  hasOpenIncident,
  openIncidentCount,
} from '@/lib/operations'
import type { Project, User } from '@/types'

function baseProject(overrides?: Partial<Project>): Project {
  return {
    id: 'prj-ops',
    title: 'Ops test',
    submitterId: 'usr-submitter',
    sponsorId: 'usr-sponsor',
    businessAnalystId: null,
    dataEngineerId: null,
    programManagerId: null,
    maintenanceOwnerId: 'usr-maint',
    group: 'Field',
    site: 'Cebu',
    department: 'Ops',
    status: 'Active',
    currentStage: 'Use',
    stageStatus: {
      Assessment: 'Completed',
      Policy: 'Completed',
      SupplierOversight: 'Completed',
      Development: 'Completed',
      Deployment: 'Completed',
      Use: 'InProgress',
      Improvement: 'NotStarted',
      Decommissioning: 'NotStarted',
      Enablement: 'NotStarted',
    },
    submission: {
      useCase: 'x',
      problem: 'x',
      goal: 'x',
      targetUsers: 'x',
      expectedOutcome: 'x',
      dataSources: 'x',
      dataSensitivity: 'Internal',
      dataAccessStatus: 'Available',
      skillLevelAvailable: 'Basic',
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
    tier: 'Tier1',
    tierRationale: '',
    autoTiered: false,
    rewardCategory: 'Kaizen',
    ehsCoordinatorId: null,
    qualification: null,
    readiness: null,
    requirements: null,
    pmRequirementsGate: null,
    pmDevelopmentGate: null,
    uat: null,
    verification: null,
    usesExternalVendor: false,
    vendorSaq: null,
    operations: emptyOperations(),
    activeSince: '',
    lastActivityAt: '',
    sponsorDecision: null,
    sponsorDecisionNote: '',
    ...overrides,
  }
}

const ms: User = {
  id: 'usr-maint',
  displayName: 'M&S',
  role: 'MaintenanceSustainability',
  group: 'Field',
  site: 'Costa Rica',
  department: 'Ops',
}
const otherMs: User = {
  id: 'usr-maint-2',
  displayName: 'Other M&S',
  role: 'MaintenanceSustainability',
  group: 'Field',
  site: 'Cebu',
  department: 'Ops',
}
const admin: User = {
  id: 'usr-admin',
  displayName: 'Admin',
  role: 'Admin',
  group: 'PROGs',
  site: 'Cebu',
  department: 'Admin',
}
const de: User = {
  id: 'usr-data',
  displayName: 'DE',
  role: 'DataEngineering',
  group: 'PROGs',
  site: 'Cebu',
  department: 'DE',
}

describe('operations (Phase 11)', () => {
  it('canOperate: assigned M&S and Admin yes; other role no', () => {
    const project = baseProject()
    expect(canOperate(project, ms)).toBe(true)
    expect(canOperate(project, admin)).toBe(true)
    expect(canOperate(project, de)).toBe(false)
    expect(canOperate(project, otherMs)).toBe(false)
  })

  it('canOperate: role-wide M&S fallback when unassigned', () => {
    const project = baseProject({ maintenanceOwnerId: null })
    expect(canOperate(project, ms)).toBe(true)
    expect(canOperate(project, otherMs)).toBe(true)
    expect(canOperate(project, de)).toBe(false)
  })

  it('open incident forces deriveHealth to Incident', () => {
    const project = baseProject({
      operations: {
        health: 'Healthy',
        incidents: [
          {
            id: 'inc-1',
            openedAt: '',
            severity: 'High',
            summary: 'Outage',
            status: 'Open',
            closedAt: null,
            note: '',
          },
        ],
        drift: 'None',
        driftNote: '',
        lastReviewedAt: null,
      },
    })
    expect(hasOpenIncident(project)).toBe(true)
    expect(openIncidentCount(project)).toBe(1)
    expect(deriveHealth(project)).toBe('Incident')
  })

  it('deriveHealth uses stored health when no open incidents', () => {
    expect(deriveHealth(baseProject({ operations: { ...emptyOperations(), health: 'Watch' } }))).toBe(
      'Watch',
    )
  })
})
