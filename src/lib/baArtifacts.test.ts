import { describe, expect, it } from 'vitest'
import {
  canCompleteDeployment,
  canCompleteDevelopment,
  canEnterDeployment,
  deploymentGateBlockReason,
  isBaGateMandatory,
  requirementsComplete,
  uatPassed,
} from '@/lib/baArtifacts'
import type { Project, User } from '@/types'

function baseProject(overrides?: Partial<Project>): Project {
  return {
    id: 'prj-test',
    title: 'Test',
    submitterId: 'usr-submitter',
    sponsorId: 'usr-sponsor',
    businessAnalystId: 'usr-ba',
    dataEngineerId: null,
    programManagerId: null,
    maintenanceOwnerId: null,
    operations: null,
    verification: null,
    usesExternalVendor: false,
    vendorSaq: null,
    group: 'PROGs',
    site: 'Cebu',
    department: 'Test',
    status: 'Active',
    currentStage: 'Development',
    stageStatus: {
      Assessment: 'Completed',
      Policy: 'Completed',
      SupplierOversight: 'Completed',
      Development: 'InProgress',
      Deployment: 'NotStarted',
      Use: 'NotStarted',
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
    tier: 'Tier2',
    tierRationale: '',
    autoTiered: false,
    rewardCategory: 'TeamProject',
    ehsCoordinatorId: null,
    qualification: null,
    readiness: null,
    requirements: null,
    pmRequirementsGate: null,
    pmDevelopmentGate: null,
    uat: null,
    activeSince: null,
    lastActivityAt: '',
    sponsorDecision: null,
    sponsorDecisionNote: '',
    ...overrides,
  }
}

const ba: User = {
  id: 'usr-ba',
  displayName: 'Chris Aguillon',
  role: 'BusinessAnalyst',
  group: 'PROGs',
  site: 'Cebu',
  department: 'BA',
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

describe('baArtifacts', () => {
  it('isBaGateMandatory is false for Tier1 and true for Tier2/3', () => {
    expect(isBaGateMandatory(baseProject({ tier: 'Tier1' }))).toBe(false)
    expect(isBaGateMandatory(baseProject({ tier: 'Tier2' }))).toBe(true)
    expect(isBaGateMandatory(baseProject({ tier: 'Tier3' }))).toBe(true)
    expect(isBaGateMandatory(baseProject({ tier: null }))).toBe(false)
  })

  it('requirementsComplete needs ≥1 item and confirmedBy', () => {
    expect(requirementsComplete(baseProject())).toBe(false)
    expect(
      requirementsComplete(
        baseProject({
          requirements: {
            items: [{ id: '1', text: 'A', priority: 'Must' }],
            notes: '',
            confirmedBy: null,
            confirmedAt: null,
          },
        }),
      ),
    ).toBe(false)
    expect(
      requirementsComplete(
        baseProject({
          requirements: {
            items: [{ id: '1', text: 'A', priority: 'Must' }],
            notes: '',
            confirmedBy: 'usr-ba',
            confirmedAt: '2026-01-01',
          },
        }),
      ),
    ).toBe(true)
  })

  it('uatPassed needs Pass outcome and signedOffBy', () => {
    expect(uatPassed(baseProject())).toBe(false)
    expect(
      uatPassed(
        baseProject({
          uat: {
            cases: [],
            outcome: 'Pass',
            notes: '',
            signedOffBy: null,
            signedOffAt: null,
          },
        }),
      ),
    ).toBe(false)
    expect(
      uatPassed(
        baseProject({
          uat: {
            cases: [{ id: '1', description: 'x', result: 'Pass' }],
            outcome: 'Pass',
            notes: '',
            signedOffBy: 'usr-ba',
            signedOffAt: '2026-01-01',
          },
        }),
      ),
    ).toBe(true)
  })

  it('canCompleteDevelopment blocks Tier2 without confirm except Admin', () => {
    const incomplete = baseProject({ tier: 'Tier2' })
    expect(canCompleteDevelopment(incomplete, ba)).toBe(false)
    expect(canCompleteDevelopment(incomplete, de)).toBe(false)
    expect(canCompleteDevelopment(incomplete, admin)).toBe(true)
    expect(canCompleteDevelopment(baseProject({ tier: 'Tier1' }), de)).toBe(true)
  })

  it('Tier2 requires PM Gate 1 Accept in addition to BA confirm; Tier1 has no gate', () => {
    const confirmed = baseProject({
      tier: 'Tier2',
      requirements: {
        items: [{ id: '1', text: 'A', priority: 'Must' }],
        notes: '',
        confirmedBy: 'usr-ba',
        confirmedAt: '2026-01-01',
      },
      pmRequirementsGate: { status: 'Pending', decidedBy: null, decidedAt: null, reason: '' },
    })
    expect(canCompleteDevelopment(confirmed, de)).toBe(false)

    const accepted = baseProject({
      ...confirmed,
      pmRequirementsGate: {
        status: 'Accepted',
        decidedBy: 'usr-pm',
        decidedAt: '2026-01-02',
        reason: '',
      },
    })
    expect(canCompleteDevelopment(accepted, de)).toBe(true)
    expect(canCompleteDevelopment(baseProject({ tier: 'Tier1' }), de)).toBe(true)
  })

  it('canEnterDeployment requires Gate 2 Accept for Tier3 only', () => {
    const t3 = baseProject({
      tier: 'Tier3',
      pmDevelopmentGate: { status: 'Pending', decidedBy: null, decidedAt: null, reason: '' },
    })
    expect(canEnterDeployment(t3, de)).toBe(false)
    expect(canEnterDeployment(t3, admin)).toBe(true)
    expect(
      canEnterDeployment(
        baseProject({
          tier: 'Tier3',
          pmDevelopmentGate: {
            status: 'Accepted',
            decidedBy: 'usr-pm',
            decidedAt: '2026-01-02',
            reason: '',
          },
        }),
        de,
      ),
    ).toBe(true)
    expect(canEnterDeployment(baseProject({ tier: 'Tier2' }), de)).toBe(true)
  })

  it('canCompleteDeployment requires both UAT and verification for Tier3', () => {
    const incomplete = baseProject({ tier: 'Tier3', currentStage: 'Deployment' })
    expect(canCompleteDeployment(incomplete, ba)).toBe(false)
    expect(canCompleteDeployment(incomplete, admin)).toBe(true)

    const uatOnly = baseProject({
      tier: 'Tier3',
      uat: {
        cases: [{ id: '1', description: 'x', result: 'Pass' }],
        outcome: 'Pass',
        notes: '',
        signedOffBy: 'usr-ba',
        signedOffAt: '2026-01-01',
      },
    })
    expect(canCompleteDeployment(uatOnly, ba)).toBe(false)

    const both = baseProject({
      tier: 'Tier3',
      uat: {
        cases: [{ id: '1', description: 'x', result: 'Pass' }],
        outcome: 'Pass',
        notes: '',
        signedOffBy: 'usr-ba',
        signedOffAt: '2026-01-01',
      },
      verification: {
        checks: [{ id: '1', description: 'x', result: 'Pass' }],
        outcome: 'Pass',
        notes: '',
        verifiedBy: 'usr-data',
        verifiedAt: '2026-01-01',
      },
    })
    expect(canCompleteDeployment(both, ba)).toBe(true)
    expect(canCompleteDeployment(baseProject({ tier: 'Tier1' }), de)).toBe(true)

    const failedVer = baseProject({
      tier: 'Tier3',
      uat: {
        cases: [{ id: '1', description: 'x', result: 'Pass' }],
        outcome: 'Pass',
        notes: '',
        signedOffBy: 'usr-ba',
        signedOffAt: '2026-01-01',
      },
      verification: {
        checks: [{ id: '1', description: 'x', result: 'Fail' }],
        outcome: 'Fail',
        notes: 'Remediate',
        verifiedBy: 'usr-data',
        verifiedAt: '2026-01-01',
      },
    })
    expect(canCompleteDeployment(failedVer, ba)).toBe(false)
    expect(deploymentGateBlockReason(failedVer)).toMatch(/verification is Fail/i)
  })
})
