import { describe, expect, it } from 'vitest'
import {
  canCompleteSupplierOversight,
  canEditSaq,
  defaultSaqAnswers,
  emptySaq,
  isSaqRequired,
  saqCiLabel,
  saqComplete,
  SAQ_DECLARATION,
  SAQ_SECTIONS,
  supplierGateBlockReason,
} from '@/lib/vendorSaq'
import type { Project, User } from '@/types'

function baseProject(overrides?: Partial<Project>): Project {
  return {
    id: 'prj-saq',
    title: 'SAQ',
    submitterId: 'usr-submitter',
    sponsorId: null,
    businessAnalystId: null,
    dataEngineerId: null,
    programManagerId: null,
    maintenanceOwnerId: null,
    group: 'PROGs',
    site: 'Cebu',
    department: 'Test',
    status: 'Active',
    currentStage: 'SupplierOversight',
    stageStatus: {
      Assessment: 'Completed',
      Policy: 'Completed',
      SupplierOversight: 'InProgress',
      Development: 'NotStarted',
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
    verification: null,
    operations: null,
    usesExternalVendor: true,
    vendorSaq: null,
    activeSince: null,
    lastActivityAt: '',
    sponsorDecision: null,
    sponsorDecisionNote: '',
    ...overrides,
  }
}

const rc: User = {
  id: 'usr-risk',
  displayName: 'R&C',
  role: 'RiskCompliance',
  group: 'PROGs',
  site: 'Cebu',
  department: 'Risk',
}
const de: User = {
  id: 'usr-data',
  displayName: 'DE',
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

function completedPass(): Project['vendorSaq'] {
  return {
    answers: defaultSaqAnswers().map((a) => ({ ...a, response: 'Yes' as const })),
    outcome: 'Pass',
    notes: '',
    completedBy: 'usr-risk',
    completedAt: '2026-01-01',
  }
}

describe('vendorSaq (Phase 13)', () => {
  it('encodes 31 scored questions across 8 sections (Section 9 is declaration)', () => {
    const answers = defaultSaqAnswers()
    expect(answers).toHaveLength(31)
    expect(SAQ_SECTIONS).toHaveLength(8)
    expect(SAQ_SECTIONS.reduce((n, s) => n + s.questions.length, 0)).toBe(31)
    const sections = new Set(answers.map((a) => a.section))
    expect(sections.size).toBe(8)
    expect(answers[0]?.question).toBe('Legal name of organization')
    expect(answers[30]?.question).toMatch(/cooperate with remediation/i)
    expect(SAQ_DECLARATION.section).toBe('9. Supplier Declaration')
    expect(SAQ_DECLARATION.fields).toEqual([
      'Name',
      'Title',
      'Organization',
      'Signature',
      'Date',
    ])
  })

  it('isSaqRequired follows usesExternalVendor', () => {
    expect(isSaqRequired(baseProject({ usesExternalVendor: true }))).toBe(true)
    expect(isSaqRequired(baseProject({ usesExternalVendor: false }))).toBe(false)
  })

  it('saqComplete needs Pass/Waived + completedBy + all answered', () => {
    expect(saqComplete(baseProject())).toBe(false)
    expect(
      saqComplete(
        baseProject({
          vendorSaq: {
            ...emptySaq(),
            outcome: 'Pass',
            completedBy: 'usr-risk',
            completedAt: '2026-01-01',
          },
        }),
      ),
    ).toBe(false)
    expect(saqComplete(baseProject({ vendorSaq: completedPass() }))).toBe(true)
  })

  it('canEditSaq is role-wide R&C / Admin', () => {
    expect(canEditSaq(baseProject(), rc)).toBe(true)
    expect(canEditSaq(baseProject(), admin)).toBe(true)
    expect(canEditSaq(baseProject(), de)).toBe(false)
  })

  it('canCompleteSupplierOversight: internal-only free; vendor needs SAQ; Admin override', () => {
    expect(
      canCompleteSupplierOversight(baseProject({ usesExternalVendor: false }), rc),
    ).toBe(true)
    expect(canCompleteSupplierOversight(baseProject(), rc)).toBe(false)
    expect(
      canCompleteSupplierOversight(baseProject({ vendorSaq: completedPass() }), rc),
    ).toBe(true)
    expect(canCompleteSupplierOversight(baseProject(), admin)).toBe(true)
  })

  it('supplierGateBlockReason names Fail remediation', () => {
    const failed = baseProject({
      vendorSaq: {
        answers: defaultSaqAnswers().map((a) => ({ ...a, response: 'No' as const })),
        outcome: 'Fail',
        notes: 'Gaps',
        completedBy: 'usr-risk',
        completedAt: '2026-01-01',
      },
    })
    expect(supplierGateBlockReason(failed)).toMatch(/Fail/i)
    expect(saqCiLabel(baseProject({ usesExternalVendor: false }))).toBe('N-A')
    expect(saqCiLabel(baseProject({ vendorSaq: completedPass() }))).toBe('Pass')
  })
})
