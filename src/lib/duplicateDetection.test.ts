import { describe, expect, it } from 'vitest'
import {
  DUPLICATE_SIMILARITY_THRESHOLD,
  findSimilarProjects,
  jaccardSimilarity,
  tokenize,
} from '@/lib/duplicateDetection'
import type { Project } from '@/types'

function stubProject(partial: {
  id: string
  title: string
  problem: string
  goal: string
}): Project {
  return {
    id: partial.id,
    title: partial.title,
    submitterId: 'usr-submitter',
    sponsorId: null,
    businessAnalystId: null,
    dataEngineerId: null,
    programManagerId: null,
    maintenanceOwnerId: null,
    group: 'Engineering',
    site: 'Cebu',
    department: 'Demo',
    status: 'Active',
    currentStage: 'Assessment',
    stageStatus: {
      Assessment: 'InProgress',
      Policy: 'NotStarted',
      SupplierOversight: 'NotStarted',
      Development: 'NotStarted',
      Deployment: 'NotStarted',
      Use: 'NotStarted',
      Improvement: 'NotStarted',
      Decommissioning: 'NotStarted',
      Enablement: 'NotStarted',
    },
    submission: {
      useCase: partial.title,
      problem: partial.problem,
      goal: partial.goal,
      targetUsers: 'engineers',
      expectedOutcome: 'outcome',
      dataSources: 'SharePoint',
      dataSensitivity: 'Internal',
      dataAccessStatus: 'Available',
      skillLevelAvailable: 'Basic',
      existingTools: [],
      integrationTargets: [],
      estimatedUsers: 10,
      expectedBenefitHours: 5,
    },
    recommendations: [],
    alternativeRecommendations: [],
    recommendedComboIds: [],
    toolStack: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    auditLog: [],
    reportedBenefitHours: null,
    sponsorValidated: false,
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
    lastActivityAt: new Date().toISOString(),
    sponsorDecision: null,
    sponsorDecisionNote: '',
    intakeMode: 'manual',
  }
}

describe('duplicateDetection', () => {
  it('scores identical text highly', () => {
    const text = 'Service ticket triage copilot for field engineers routing complex cases'
    const a = tokenize(text)
    const b = tokenize(text)
    expect(jaccardSimilarity(a, b)).toBe(1)
  })

  it('scores disjoint corpora as 0', () => {
    const a = tokenize('alpha beta gamma delta')
    const b = tokenize('wombat xylophone yacht zebra')
    expect(jaccardSimilarity(a, b)).toBe(0)
  })

  it('filters below threshold and returns top matches', () => {
    const projects = [
      stubProject({
        id: 'prj-a',
        title: 'Service Ticket Triage Copilot',
        problem:
          'Field engineers spend time triaging and re-routing service tickets before repair work.',
        goal: 'Deploy a copilot that classifies tickets and routes complex cases.',
      }),
      stubProject({
        id: 'prj-b',
        title: 'Spare Parts Demand Forecast',
        problem: 'Inventory planners struggle to forecast spare-parts demand.',
        goal: 'Build a forecast model for spare-parts replenishment.',
      }),
    ]

    const matches = findSimilarProjects(
      {
        title: 'Ticket triage assistant for field engineers',
        problem: 'Engineers waste shift time triaging service tickets and routing cases.',
        goal: 'Use a copilot to classify tickets and route complex cases automatically.',
      },
      projects,
      { threshold: DUPLICATE_SIMILARITY_THRESHOLD },
    )

    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0].project.id).toBe('prj-a')
    expect(matches[0].score).toBeGreaterThanOrEqual(DUPLICATE_SIMILARITY_THRESHOLD)
    expect(matches.every((m) => m.project.id !== 'prj-b' || m.score >= DUPLICATE_SIMILARITY_THRESHOLD || m.sharedTokens.length >= 3)).toBe(true)
  })
})
