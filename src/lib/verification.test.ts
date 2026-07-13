import { describe, expect, it } from 'vitest'
import {
  canEditVerification,
  isVerificationMandatory,
  outcomeFromChecks,
  verificationPassed,
} from '@/lib/verification'
import type { Project, User, VerificationCheck } from '@/types'

function baseProject(overrides?: Partial<Project>): Project {
  return {
    id: 'prj-ver',
    title: 'Ver',
    submitterId: 'usr-submitter',
    sponsorId: null,
    businessAnalystId: null,
    dataEngineerId: 'usr-data',
    programManagerId: null,
    maintenanceOwnerId: null,
    group: 'PROGs',
    site: 'Cebu',
    department: 'DE',
    status: 'Active',
    currentStage: 'Deployment',
    stageStatus: {
      Assessment: 'Completed',
      Policy: 'Completed',
      SupplierOversight: 'Completed',
      Development: 'Completed',
      Deployment: 'InProgress',
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
    verification: null,
    usesExternalVendor: false,
    vendorSaq: null,
    operations: null,
    activeSince: null,
    lastActivityAt: '',
    sponsorDecision: null,
    sponsorDecisionNote: '',
    ...overrides,
  }
}

const de: User = {
  id: 'usr-data',
  displayName: 'DE',
  role: 'DataEngineering',
  group: 'PROGs',
  site: 'Cebu',
  department: 'DE',
}
const otherDe: User = {
  id: 'usr-data-2',
  displayName: 'Other DE',
  role: 'DataEngineering',
  group: 'PROGs',
  site: 'Cebu',
  department: 'DE',
}
const admin: User = {
  id: 'usr-admin',
  displayName: 'Admin',
  role: 'Admin',
  group: 'PROGs',
  site: 'Cebu',
  department: 'Admin',
}

describe('verification (Phase 12)', () => {
  it('verificationPassed needs Pass + verifiedBy', () => {
    expect(verificationPassed(baseProject())).toBe(false)
    expect(
      verificationPassed(
        baseProject({
          verification: {
            checks: [],
            outcome: 'Pass',
            notes: '',
            verifiedBy: null,
            verifiedAt: null,
          },
        }),
      ),
    ).toBe(false)
    expect(
      verificationPassed(
        baseProject({
          verification: {
            checks: [{ id: '1', description: 'x', result: 'Pass' }],
            outcome: 'Pass',
            notes: '',
            verifiedBy: 'usr-data',
            verifiedAt: '2026-01-01',
          },
        }),
      ),
    ).toBe(true)
  })

  it('outcomeFromChecks derives Pass/Fail/Pending', () => {
    const allPass: VerificationCheck[] = [
      { id: '1', description: 'a', result: 'Pass' },
      { id: '2', description: 'b', result: 'Pass' },
    ]
    expect(outcomeFromChecks(allPass)).toBe('Pass')
    expect(
      outcomeFromChecks([
        { id: '1', description: 'a', result: 'Pass' },
        { id: '2', description: 'b', result: 'Fail' },
      ]),
    ).toBe('Fail')
    expect(
      outcomeFromChecks([{ id: '1', description: 'a', result: 'Untested' }]),
    ).toBe('Pending')
  })

  it('canEditVerification: assigned DE / Admin / unassigned fallback', () => {
    expect(canEditVerification(baseProject(), de)).toBe(true)
    expect(canEditVerification(baseProject(), otherDe)).toBe(false)
    expect(canEditVerification(baseProject(), admin)).toBe(true)
    expect(canEditVerification(baseProject({ dataEngineerId: null }), otherDe)).toBe(true)
  })

  it('isVerificationMandatory matches Tier2/3', () => {
    expect(isVerificationMandatory(baseProject({ tier: 'Tier1' }))).toBe(false)
    expect(isVerificationMandatory(baseProject({ tier: 'Tier2' }))).toBe(true)
  })
})
