import { beforeEach, describe, expect, it } from 'vitest'
import { SEED_USERS } from '@/data/seedRoles'
import { useCatalogStore } from '@/stores/catalogStore'
import { useProjectsStore } from '@/stores/projectsStore'
import type { Project, Submission, User } from '@/types'

function userByRole(role: User['role']): User {
  const user = SEED_USERS.find((u) => u.role === role)
  if (!user) throw new Error(`Missing seed user for role ${role}`)
  return user
}

function minimalSubmission(): Submission {
  return {
    useCase: 'Test use case',
    problem: 'Problem statement for tests',
    goal: 'Goal statement for tests',
    targetUsers: 'Testers',
    expectedOutcome: 'Outcome',
    dataSources: 'SharePoint',
    dataSensitivity: 'Internal',
    dataAccessStatus: 'Available',
    skillLevelAvailable: 'Intermediate',
    existingTools: ['SharePoint'],
    integrationTargets: ['Teams'],
    estimatedUsers: 10,
    expectedBenefitHours: 5,
  }
}

function makeQualifiedProject(overrides?: Partial<Project>): Project {
  const created = useProjectsStore.getState().createProject({
    title: 'Gate test project',
    submitterId: 'usr-submitter',
    group: 'Engineering',
    site: 'Cebu',
    department: 'Test',
    submission: minimalSubmission(),
  })
  useProjectsStore.setState((state) => ({
    projects: state.projects.map((p) =>
      p.id === created.id
        ? {
            ...p,
            status: 'Qualified',
            currentStage: 'Policy',
            stageStatus: { ...p.stageStatus, Assessment: 'Completed', Policy: 'NotStarted' },
            ...overrides,
          }
        : p,
    ),
  }))
  const project = useProjectsStore.getState().projects.find((p) => p.id === created.id)
  if (!project) throw new Error('Failed to seed qualified project')
  return project
}

describe('projectsStore Phase 4 gates', () => {
  beforeEach(() => {
    useProjectsStore.getState().resetProjects()
    useCatalogStore.getState().resetCatalog?.()
  })

  it('submitForReview is blocked with an empty tool stack', () => {
    const project = makeQualifiedProject({ toolStack: [] })
    const submitter = userByRole('Submitter')
    expect(() =>
      useProjectsStore.getState().submitForReview(project.id, submitter),
    ).toThrow(/tool stack/i)
  })

  it('approveSubmission routes to ForEHSReview when coordinator is set', () => {
    const project = makeQualifiedProject({
      toolStack: [{ toolId: 'tool-sharepoint', role: 'primary' }],
      status: 'Submitted',
      ehsCoordinatorId: 'usr-ehs',
    })
    const gov = userByRole('GovernanceLead')
    useProjectsStore.getState().approveSubmission(project.id, gov)
    const updated = useProjectsStore.getState().projects.find((p) => p.id === project.id)
    expect(updated?.status).toBe('ForEHSReview')
    expect(updated?.activeSince).toBeNull()
  })

  it('approveSubmission routes to Active when no EHS coordinator', () => {
    const project = makeQualifiedProject({
      toolStack: [{ toolId: 'tool-sharepoint', role: 'primary' }],
      status: 'Submitted',
      ehsCoordinatorId: null,
    })
    const gov = userByRole('GovernanceLead')
    useProjectsStore.getState().approveSubmission(project.id, gov)
    const updated = useProjectsStore.getState().projects.find((p) => p.id === project.id)
    expect(updated?.status).toBe('Active')
    expect(updated?.activeSince).toBeTruthy()
    expect(updated?.currentStage).toBe('Development')
    expect(updated?.stageStatus.Development).toBe('InProgress')
  })

  it('activateProject stamps activeSince only once', () => {
    const stamped = '2026-01-01T00:00:00.000Z'
    const project = makeQualifiedProject({
      toolStack: [{ toolId: 'tool-sharepoint', role: 'primary' }],
      status: 'ForEHSReview',
      ehsCoordinatorId: 'usr-ehs',
      activeSince: stamped,
    })
    const ehs = userByRole('EHS')
    useProjectsStore.getState().ehsApprove(project.id, ehs)
    const updated = useProjectsStore.getState().projects.find((p) => p.id === project.id)
    expect(updated?.status).toBe('Active')
    expect(updated?.activeSince).toBe(stamped)
  })
})

describe('projectsStore Phase 5 closure', () => {
  beforeEach(() => {
    useProjectsStore.getState().resetProjects()
  })

  it('submitForSponsorApproval is blocked until hours are reported', () => {
    const project = makeQualifiedProject({
      status: 'Active',
      currentStage: 'Development',
      reportedBenefitHours: null,
      sponsorId: 'usr-sponsor',
    })
    const submitter = userByRole('Submitter')
    expect(() =>
      useProjectsStore.getState().submitForSponsorApproval(
        project.id,
        { reportedBenefitHours: 0 },
        submitter,
      ),
    ).toThrow(/benefit hours/i)
  })

  it('sponsorApprove completes the project and sets sponsorValidated', () => {
    const project = makeQualifiedProject({
      status: 'ForSponsorApproval',
      currentStage: 'Use',
      reportedBenefitHours: 18,
      sponsorId: 'usr-sponsor',
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
    })
    const sponsor = userByRole('Sponsor')
    useProjectsStore.getState().sponsorApprove(project.id, sponsor)
    const updated = useProjectsStore.getState().projects.find((p) => p.id === project.id)
    expect(updated?.status).toBe('Completed')
    expect(updated?.sponsorValidated).toBe(true)
    expect(updated?.sponsorDecision).toBe('Approved')
    expect(updated?.stageStatus.Use).toBe('Completed')
  })
})
