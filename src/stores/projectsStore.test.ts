import { beforeEach, describe, expect, it } from 'vitest'
import { DEMO_TODAY } from '@/data/seedProjects'
import { SEED_USERS } from '@/data/seedRoles'
import { useCatalogStore } from '@/stores/catalogStore'
import { demoNowIso, useDemoClockStore } from '@/stores/demoClockStore'
import { useNotificationsStore } from '@/stores/notificationsStore'
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

  it('ehsApprove is blocked for a non-assigned EHS when coordinator is set', () => {
    const project = makeQualifiedProject({
      toolStack: [{ toolId: 'tool-sharepoint', role: 'primary' }],
      status: 'ForEHSReview',
      ehsCoordinatorId: 'usr-ehs',
    })
    const impostor: User = {
      ...userByRole('EHS'),
      id: 'usr-ehs-other',
      displayName: 'Other EHS',
    }
    expect(() => useProjectsStore.getState().ehsApprove(project.id, impostor)).toThrow(
      /assigned EHS coordinator/i,
    )
    expect(() =>
      useProjectsStore.getState().ehsApprove(project.id, userByRole('EHS')),
    ).not.toThrow()
  })

  it('ehsApprove allows Admin even when coordinator is set', () => {
    const project = makeQualifiedProject({
      toolStack: [{ toolId: 'tool-sharepoint', role: 'primary' }],
      status: 'ForEHSReview',
      ehsCoordinatorId: 'usr-ehs',
    })
    expect(() =>
      useProjectsStore.getState().ehsApprove(project.id, userByRole('Admin')),
    ).not.toThrow()
  })
})

describe('projectsStore Phase 10 delivery slots', () => {
  beforeEach(() => {
    useProjectsStore.getState().resetProjects()
    useCatalogStore.getState().resetCatalog?.()
    useNotificationsStore.getState().clear()
  })

  it('assignDataEngineer sets field and audit; DE may self-claim', () => {
    const project = makeQualifiedProject()
    const de = userByRole('DataEngineering')
    useProjectsStore.getState().assignDataEngineer(project.id, de.id, de)
    const updated = useProjectsStore.getState().projects.find((p) => p.id === project.id)
    expect(updated?.dataEngineerId).toBe(de.id)
    expect(updated?.auditLog.some((e) => e.note.includes('Assigned Data Engineer'))).toBe(true)
  })

  it('assignDataEngineer denies DE assigning someone else', () => {
    const project = makeQualifiedProject()
    const de = userByRole('DataEngineering')
    expect(() =>
      useProjectsStore.getState().assignDataEngineer(project.id, 'usr-other', de),
    ).toThrow(/claiming themselves|Data Engineer/i)
  })

  it('assignProgramManager and assignMaintenanceOwner work for governance', () => {
    const project = makeQualifiedProject()
    const gov = userByRole('GovernanceLead')
    useProjectsStore.getState().assignProgramManager(project.id, 'usr-pm', gov)
    useProjectsStore.getState().assignMaintenanceOwner(project.id, 'usr-maint', gov)
    const updated = useProjectsStore.getState().projects.find((p) => p.id === project.id)
    expect(updated?.programManagerId).toBe('usr-pm')
    expect(updated?.maintenanceOwnerId).toBe('usr-maint')
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

describe('projectsStore Phase 6 aging', () => {
  beforeEach(() => {
    useProjectsStore.getState().resetProjects()
    useDemoClockStore.getState().reset()
    useNotificationsStore.getState().clear()
  })

  it('runAging transitions Active→Idle and emits a notification', () => {
    const created = useProjectsStore.getState().createProject({
      title: 'Aging idle test',
      submitterId: 'usr-submitter',
      group: 'Engineering',
      site: 'Cebu',
      department: 'Test',
      submission: minimalSubmission(),
    })
    const fifteenDaysAgo = new Date(
      DEMO_TODAY.getTime() - 15 * 86400000,
    ).toISOString()
    useProjectsStore.setState((state) => ({
      projects: state.projects.map((p) =>
        p.id === created.id
          ? {
              ...p,
              status: 'Active' as const,
              lastActivityAt: fifteenDaysAgo,
              activeSince: fifteenDaysAgo,
              agingMilestone: 'none' as const,
            }
          : p,
      ),
    }))

    useProjectsStore.getState().runAging()
    const updated = useProjectsStore.getState().projects.find((p) => p.id === created.id)
    expect(updated?.status).toBe('Idle')
    expect(updated?.agingMilestone).toBe('idle')

    const notes = useNotificationsStore.getState().notifications
    expect(notes.some((n) => n.kind === 'aging-idle' && n.projectId === created.id)).toBe(true)
  })

  it('reactivateProject resets lastActivityAt and returns to Active', () => {
    const created = useProjectsStore.getState().createProject({
      title: 'Reactivate test',
      submitterId: 'usr-submitter',
      group: 'Engineering',
      site: 'Cebu',
      department: 'Test',
      submission: minimalSubmission(),
    })
    const old = new Date(DEMO_TODAY.getTime() - 20 * 86400000).toISOString()
    useProjectsStore.setState((state) => ({
      projects: state.projects.map((p) =>
        p.id === created.id
          ? {
              ...p,
              status: 'Idle' as const,
              lastActivityAt: old,
              agingMilestone: 'idle' as const,
            }
          : p,
      ),
    }))

    const submitter = userByRole('Submitter')
    useProjectsStore.getState().reactivateProject(created.id, submitter)
    const updated = useProjectsStore.getState().projects.find((p) => p.id === created.id)
    expect(updated?.status).toBe('Active')
    expect(updated?.agingMilestone).toBe('none')
    expect(updated?.lastActivityAt).toBe(demoNowIso())
  })

  it('reactivateProject allows MaintenanceSustainability', () => {
    const created = useProjectsStore.getState().createProject({
      title: 'M&S reactivate',
      submitterId: 'usr-submitter',
      group: 'Engineering',
      site: 'Cebu',
      department: 'Test',
      submission: minimalSubmission(),
    })
    useProjectsStore.setState((state) => ({
      projects: state.projects.map((p) =>
        p.id === created.id ? { ...p, status: 'Idle' as const, agingMilestone: 'idle' as const } : p,
      ),
    }))
    const ms = userByRole('MaintenanceSustainability')
    expect(() =>
      useProjectsStore.getState().reactivateProject(created.id, ms),
    ).not.toThrow()
    expect(useProjectsStore.getState().projects.find((p) => p.id === created.id)?.status).toBe(
      'Active',
    )
  })
})

describe('projectsStore Phase 8 BA gates', () => {
  beforeEach(() => {
    useProjectsStore.getState().resetProjects()
    useCatalogStore.getState().resetCatalog?.()
    useNotificationsStore.getState().clear()
    useDemoClockStore.getState().reset()
  })

  it('advanceStage throws on Development Complete without confirmed requirements for Tier2', () => {
    const project = makeQualifiedProject({
      status: 'Active',
      tier: 'Tier2',
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
      businessAnalystId: 'usr-ba',
      requirements: {
        items: [{ id: '1', text: 'Need confirm', priority: 'Must' }],
        notes: '',
        confirmedBy: null,
        confirmedAt: null,
      },
    })
    const de = userByRole('DataEngineering')
    expect(() =>
      useProjectsStore
        .getState()
        .advanceStage(project.id, 'Development', 'Completed', de, 'Done'),
    ).toThrow(/requirements/i)
  })

  it('advanceStage allows Admin override on Development Complete without requirements', () => {
    const project = makeQualifiedProject({
      status: 'Active',
      tier: 'Tier2',
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
      businessAnalystId: 'usr-ba',
      requirements: null,
    })
    const admin = userByRole('Admin')
    expect(() =>
      useProjectsStore
        .getState()
        .advanceStage(project.id, 'Development', 'Completed', admin, 'Admin override'),
    ).not.toThrow()
  })

  it('submitForSponsorApproval is blocked without passing UAT for Tier3', () => {
    const project = makeQualifiedProject({
      status: 'Active',
      tier: 'Tier3',
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
      businessAnalystId: 'usr-ba',
      reportedBenefitHours: 10,
      uat: null,
    })
    const de = userByRole('DataEngineering')
    expect(() =>
      useProjectsStore.getState().submitForSponsorApproval(
        project.id,
        { reportedBenefitHours: 10 },
        de,
      ),
    ).toThrow(/UAT/i)
  })
})
