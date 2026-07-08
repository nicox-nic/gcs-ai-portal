import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SEED_PROJECTS } from '@/data/seedProjects'
import {
  computeAging,
  shouldApplyAgingMilestone,
} from '@/lib/aging'
import {
  canActOnStage,
  getStageMeta,
  isAllowedTransition,
} from '@/lib/lifecycle'
import { notify } from '@/lib/notificationRules'
import { canQualify } from '@/lib/qualificationLogic'
import { getAllowedStatusTransitions } from '@/lib/projectStatus'
import { canOwnStack, formatProjectReviewNote } from '@/lib/tiering'
import { humanizeRole } from '@/lib/utils'
import { useCatalogStore } from '@/stores/catalogStore'
import { demoNowIso, getDemoNow } from '@/stores/demoClockStore'
import type {
  AgingMilestone,
  Group,
  LifecycleStage,
  Project,
  ProjectStatus,
  ProjectTier,
  QualificationAssessment,
  ReadinessAssessment,
  Recommendation,
  RewardCategory,
  Site,
  StageStatus,
  StageTransition,
  Submission,
  ToolStackEntry,
  User,
} from '@/types'

type CreateProjectInput = {
  title: string
  submitterId: string
  group: Group
  site: Site
  department: string
  submission: Submission
  intakeMode?: 'manual' | 'assisted'
}

type QualifyPayload = {
  readiness: ReadinessAssessment
  qualification: QualificationAssessment
  tier: ProjectTier
  tierRationale: string
  rewardCategory: RewardCategory
}

const QUALIFY_ROLES: User['role'][] = ['GovernanceLead', 'RiskCompliance', 'Admin']
const CANCEL_GOVERNANCE_ROLES: User['role'][] = ['GovernanceLead', 'RiskCompliance', 'Admin']
const SUBMISSION_REVIEW_ROLES: User['role'][] = [
  'GovernanceLead',
  'AIProgramManager',
  'Admin',
]
const EHS_ASSIGN_ROLES: User['role'][] = ['GovernanceLead', 'AIProgramManager', 'Admin']
const EHS_ACTION_ROLES: User['role'][] = ['EHS', 'Admin']
const PROJECT_REVIEW_ROLES: User['role'][] = [
  'AIProgramManager',
  'GovernanceLead',
  'Admin',
]

type ProjectsStore = {
  projects: Project[]
  createProject: (input: CreateProjectInput) => Project
  submitProject: (projectId: string) => void
  setRecommendations: (
    projectId: string,
    recs: Recommendation[],
    alternatives: Recommendation[],
    recommendedComboIds: string[],
  ) => void
  applyCombo: (projectId: string, comboId: string) => void
  updateToolStack: (projectId: string, stack: ToolStackEntry[]) => void
  advanceStage: (
    projectId: string,
    toStage: LifecycleStage,
    toStatus: StageStatus,
    actor: User,
    note: string,
  ) => void
  qualifyProject: (
    projectId: string,
    payload: QualifyPayload,
    actor: User,
    note: string,
  ) => void
  rejectQualification: (projectId: string, reason: string, actor: User) => void
  resubmitForAssessment: (projectId: string, actor: User) => void
  cancelProject: (projectId: string, reason: string, actor: User) => void
  submitForReview: (projectId: string, actor: User) => void
  saveQualifiedDraft: (projectId: string, actor: User) => void
  assignEhsCoordinator: (projectId: string, ehsUserId: string | null, actor: User) => void
  approveSubmission: (projectId: string, actor: User, note?: string) => void
  rejectSubmission: (projectId: string, reason: string, actor: User) => void
  ehsApprove: (projectId: string, actor: User, note?: string) => void
  ehsReject: (projectId: string, reason: string, actor: User) => void
  resubmitAfterRejection: (projectId: string, actor: User) => void
  logProjectReview: (projectId: string, note: string, actor: User) => void
  submitForSponsorApproval: (
    projectId: string,
    payload: { reportedBenefitHours: number; sponsorId?: string | null },
    actor: User,
  ) => void
  sponsorApprove: (projectId: string, actor: User, note?: string) => void
  sponsorDisapprove: (projectId: string, reason: string, actor: User) => void
  reviseAfterDisapproval: (projectId: string, actor: User) => void
  updateProject: (projectId: string, patch: Partial<Project>) => void
  reportBenefits: (projectId: string, hours: number) => void
  runAging: () => void
  reactivateProject: (projectId: string, actor: User) => void
  resetProjects: () => void
}

function emptyStageStatus(): Record<LifecycleStage, StageStatus> {
  return {
    Assessment: 'NotStarted',
    Policy: 'NotStarted',
    SupplierOversight: 'NotStarted',
    Development: 'NotStarted',
    Deployment: 'NotStarted',
    Use: 'NotStarted',
    Improvement: 'NotStarted',
    Decommissioning: 'NotStarted',
    Enablement: 'NotStarted',
  }
}

function nowIso(): string {
  return demoNowIso()
}

const AGING_SYSTEM_ACTOR: User = {
  id: 'system-aging',
  displayName: 'Aging Engine',
  role: 'Admin',
  group: 'PROGs',
  site: 'Cebu',
  department: 'System',
}

function appendTransition(
  project: Project,
  partial: Omit<StageTransition, 'id' | 'projectId' | 'timestamp'> & { timestamp?: string },
): StageTransition {
  return {
    id: `trn-${project.id}-${nanoid(6)}`,
    projectId: project.id,
    timestamp: partial.timestamp ?? nowIso(),
    fromStage: partial.fromStage,
    toStage: partial.toStage,
    fromStatus: partial.fromStatus,
    toStatus: partial.toStatus,
    actorUserId: partial.actorUserId,
    actorRole: partial.actorRole,
    note: partial.note,
  }
}

/**
 * Stage→status side effects for ISO lifecycle advances.
 * Active is gated via approveSubmission / ehsApprove (Phase 4) — no auto-Active from stage advance.
 * Completed arrives only from sponsor approval (Phase 5) — no Use→Completed auto-rule.
 * Qualification is explicit via qualifyProject (Phase 3) — no Assessment→Qualified auto-rule.
 *
 * Kept: Decommissioning stage Completed → Deactivated (governance retirement path).
 * Aging can also set Deactivated independently; this mapping covers intentional ISO retirement.
 */
function applyStatusSideEffects(
  project: Project,
  toStage: LifecycleStage,
  toStatus: StageStatus,
): Pick<Project, 'status' | 'activeSince' | 'lastActivityAt'> {
  let status = project.status
  const activeSince = project.activeSince
  const lastActivityAt = nowIso()

  if (toStage === 'Decommissioning' && toStatus === 'Completed') {
    status = 'Deactivated'
  }

  return { status, activeSince, lastActivityAt }
}

function assertStatusTransition(from: ProjectStatus, to: ProjectStatus): void {
  const allowed = getAllowedStatusTransitions(from)
  if (!allowed.includes(to)) {
    throw new Error(`Cannot transition project status from ${from} to ${to}.`)
  }
}

function assertCanQualify(actor: User): void {
  if (!QUALIFY_ROLES.includes(actor.role)) {
    throw new Error(
      `Only ${humanizeRole('GovernanceLead')}, ${humanizeRole('RiskCompliance')}, or Admin can qualify projects.`,
    )
  }
}

function assertRole(actor: User, roles: User['role'][], message: string): void {
  if (!roles.includes(actor.role)) {
    throw new Error(message)
  }
}

function canActOnClosureSubmit(actor: User, project: Project): boolean {
  if (actor.role === 'Admin') return true
  if (actor.id === project.submitterId) return true
  return actor.role === 'DataEngineering' || actor.role === 'AIProgramManager'
}

function canSponsorDecide(actor: User, project: Project): boolean {
  if (actor.role === 'Admin') return true
  if (actor.role === 'Sponsor' && project.sponsorId && actor.id === project.sponsorId) {
    return true
  }
  // Unassigned sponsor: any Sponsor persona may decide in the demo
  if (actor.role === 'Sponsor' && !project.sponsorId) return true
  return false
}

/** Stamp Active + Development InProgress. Called by approveSubmission (no-EHS) and ehsApprove. */
function activateProjectFields(project: Project, timestamp: string): Partial<Project> {
  return {
    status: 'Active' as const,
    activeSince: project.activeSince ?? timestamp,
    lastActivityAt: timestamp,
    agingMilestone: 'none' as AgingMilestone,
    currentStage: 'Development' as const,
    stageStatus: {
      ...project.stageStatus,
      Development: 'InProgress',
    },
  }
}

function emptyV3Fields(timestamp: string) {
  return {
    tier: null as Project['tier'],
    tierRationale: '',
    autoTiered: false,
    rewardCategory: null as Project['rewardCategory'],
    ehsCoordinatorId: null as string | null,
    qualification: null as Project['qualification'],
    readiness: null as Project['readiness'],
    activeSince: null as string | null,
    lastActivityAt: timestamp,
    sponsorDecision: null as Project['sponsorDecision'],
    sponsorDecisionNote: '',
    agingMilestone: 'none' as AgingMilestone,
  }
}

export const useProjectsStore = create<ProjectsStore>()(
  persist(
    (set, get) => ({
      projects: structuredClone(SEED_PROJECTS),

      createProject: (input) => {
        const timestamp = nowIso()
        const project: Project = {
          id: `prj-${nanoid(6)}`,
          title: input.title,
          submitterId: input.submitterId,
          sponsorId: null,
          group: input.group,
          site: input.site,
          department: input.department,
          status: 'IdeaDraft',
          currentStage: 'Assessment',
          stageStatus: emptyStageStatus(),
          submission: input.submission,
          recommendations: [],
          alternativeRecommendations: [],
          recommendedComboIds: [],
          toolStack: [],
          createdAt: timestamp,
          updatedAt: timestamp,
          auditLog: [],
          reportedBenefitHours: null,
          sponsorValidated: false,
          intakeMode: input.intakeMode ?? 'manual',
          ...emptyV3Fields(timestamp),
        }
        set((state) => ({ projects: [...state.projects, project] }))
        return project
      },

      submitProject: (projectId) => {
        let notified: Project | null = null
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project
            const timestamp = nowIso()
            const transition = appendTransition(project, {
              fromStage: null,
              toStage: 'Assessment',
              fromStatus: null,
              toStatus: 'InProgress',
              actorUserId: project.submitterId,
              actorRole: 'Submitter',
              note: 'Project submitted for qualification.',
              timestamp,
            })
            const next: Project = {
              ...project,
              status: 'ForAssessment',
              currentStage: 'Assessment',
              stageStatus: {
                ...project.stageStatus,
                Assessment: 'InProgress',
              },
              auditLog: [...project.auditLog, transition],
              updatedAt: timestamp,
              lastActivityAt: timestamp,
            }
            notified = next
            return next
          }),
        }))
        if (notified) notify(notified, 'submitted-for-assessment')
      },

      setRecommendations: (projectId, recs, alternatives, recommendedComboIds) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  recommendations: recs,
                  alternativeRecommendations: alternatives,
                  recommendedComboIds,
                  updatedAt: nowIso(),
                  lastActivityAt: nowIso(),
                }
              : project,
          ),
        }))
      },

      applyCombo: (projectId, comboId) => {
        const combo = useCatalogStore.getState().combos.find((c) => c.id === comboId)
        if (!combo) {
          throw new Error(`Combo not found: ${comboId}`)
        }
        const stack: ToolStackEntry[] = [
          { toolId: combo.primaryToolId, role: 'primary' },
          ...combo.addOnToolIds.map((toolId) => ({
            toolId,
            role: 'supporting' as const,
            usageNote: combo.addOnRoles[toolId],
          })),
        ]
        get().updateToolStack(projectId, stack)
      },

      updateToolStack: (projectId, stack) => {
        const primaryCount = stack.filter((entry) => entry.role === 'primary').length
        if (primaryCount !== 1) {
          throw new Error('toolStack must contain exactly one primary tool')
        }
        const timestamp = nowIso()
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  toolStack: stack,
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : project,
          ),
        }))
      },

      advanceStage: (projectId, toStage, toStatus, actor, note) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) {
          throw new Error(`Project not found: ${projectId}`)
        }

        const currentStage = project.currentStage
        const currentStatus = project.stageStatus[currentStage]

        if (!canActOnStage(actor.role, currentStage)) {
          const meta = getStageMeta(currentStage)
          throw new Error(
            `Only ${humanizeRole(meta.primaryOwnerRole)} or supporting roles can act on this stage.`,
          )
        }

        if (!isAllowedTransition(currentStage, currentStatus, toStage, toStatus)) {
          throw new Error(
            `Cannot transition ${currentStage} from ${currentStatus} to ${toStage} (${toStatus}).`,
          )
        }

        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p

            const fromStage = p.currentStage
            const fromStatus = p.stageStatus[fromStage]
            const timestamp = nowIso()
            const transition = appendTransition(p, {
              fromStage,
              toStage,
              fromStatus,
              toStatus,
              actorUserId: actor.id,
              actorRole: actor.role,
              note,
              timestamp,
            })
            const sideEffects = applyStatusSideEffects(p, toStage, toStatus)

            return {
              ...p,
              currentStage: toStage,
              stageStatus: { ...p.stageStatus, [toStage]: toStatus },
              ...sideEffects,
              auditLog: [...p.auditLog, transition],
              updatedAt: timestamp,
            }
          }),
        }))
      },

      qualifyProject: (projectId, payload, actor, note) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        assertCanQualify(actor)
        assertStatusTransition(project.status, 'Qualified')
        if (
          !canQualify(
            payload.readiness,
            payload.qualification,
            payload.tier,
            payload.rewardCategory,
          )
        ) {
          throw new Error(
            'Cannot qualify: readiness must be Met on all dimensions, at least one Section A criterion, plus tier and reward category.',
          )
        }

        const timestamp = nowIso()
        const riskFromTier =
          payload.tier === 'Tier1' ? 'Low' : payload.tier === 'Tier2' ? 'Medium' : 'High'
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: 'Policy',
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: 'NotStarted',
          actorUserId: actor.id,
          actorRole: actor.role,
          note:
            note ||
            `Qualified as AI project. Tier ${payload.tier}; reward ${payload.rewardCategory}. ${payload.tierRationale}`.trim(),
          timestamp,
        })

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  status: 'Qualified' as const,
                  readiness: structuredClone(payload.readiness),
                  qualification: {
                    ...structuredClone(payload.qualification),
                    riskTier: payload.qualification.riskTier ?? riskFromTier,
                  },
                  tier: payload.tier,
                  tierRationale: payload.tierRationale,
                  rewardCategory: payload.rewardCategory,
                  autoTiered: false,
                  currentStage: 'Policy' as const,
                  stageStatus: {
                    ...p.stageStatus,
                    Assessment: 'Completed',
                    Policy: 'NotStarted',
                  },
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
        const updated = get().projects.find((p) => p.id === projectId)
        if (updated) notify(updated, 'qualified', actor)
      },

      rejectQualification: (projectId, reason, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        assertCanQualify(actor)
        assertStatusTransition(project.status, 'NotQualified')
        if (!reason.trim()) throw new Error('A rejection reason is required.')

        const timestamp = nowIso()
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: 'Assessment',
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: 'Blocked',
          actorUserId: actor.id,
          actorRole: actor.role,
          note: `Not qualified: ${reason.trim()}`,
          timestamp,
        })

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  status: 'NotQualified' as const,
                  stageStatus: {
                    ...p.stageStatus,
                    Assessment: 'Blocked',
                  },
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
        const updated = get().projects.find((p) => p.id === projectId)
        if (updated) notify(updated, 'not-qualified', actor)
      },

      resubmitForAssessment: (projectId, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        assertStatusTransition(project.status, 'ForAssessment')

        const canResubmit =
          QUALIFY_ROLES.includes(actor.role) ||
          actor.id === project.submitterId ||
          actor.role === 'BusinessAnalyst'
        if (!canResubmit) {
          throw new Error(
            'Only the submitter or Governance/Risk/Admin can resubmit for assessment.',
          )
        }

        const timestamp = nowIso()
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: 'Assessment',
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: 'InProgress',
          actorUserId: actor.id,
          actorRole: actor.role,
          note: 'Resubmitted for assessment after Not Qualified decision.',
          timestamp,
        })

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  status: 'ForAssessment' as const,
                  currentStage: 'Assessment' as const,
                  stageStatus: {
                    ...p.stageStatus,
                    Assessment: 'InProgress',
                  },
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
      },

      cancelProject: (projectId, reason, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        assertStatusTransition(project.status, 'Cancelled')
        if (!reason.trim()) throw new Error('A cancellation reason is required.')

        const isOwnDraft =
          project.status === 'IdeaDraft' && actor.id === project.submitterId
        const isGovernance = CANCEL_GOVERNANCE_ROLES.includes(actor.role)
        if (!isOwnDraft && !isGovernance) {
          throw new Error(
            'Only the submitter (Idea Draft) or Governance/Risk/Admin can cancel this project.',
          )
        }

        const timestamp = nowIso()
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: project.currentStage,
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: project.stageStatus[project.currentStage],
          actorUserId: actor.id,
          actorRole: actor.role,
          note: `Cancelled: ${reason.trim()}`,
          timestamp,
        })

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  status: 'Cancelled' as const,
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
      },

      submitForReview: (projectId, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canOwnStack(project, actor)) {
          throw new Error(
            'Your role cannot submit the tool stack for review on this project tier.',
          )
        }
        assertStatusTransition(project.status, 'Submitted')
        if (project.toolStack.length === 0) {
          throw new Error('Select a tool stack before submitting for review.')
        }

        const timestamp = nowIso()
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: project.currentStage,
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: project.stageStatus[project.currentStage],
          actorUserId: actor.id,
          actorRole: actor.role,
          note: 'Tool stack submitted for second review.',
          timestamp,
        })

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  status: 'Submitted' as const,
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
        const updated = get().projects.find((p) => p.id === projectId)
        if (updated) notify(updated, 'submitted-for-review', actor)
      },

      saveQualifiedDraft: (projectId, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canOwnStack(project, actor)) {
          throw new Error(
            'Your role cannot save a qualified draft on this project tier.',
          )
        }
        assertStatusTransition(project.status, 'QualifiedDraft')

        const timestamp = nowIso()
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: project.currentStage,
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: project.stageStatus[project.currentStage],
          actorUserId: actor.id,
          actorRole: actor.role,
          note: 'Saved as qualified draft (tool selection in progress).',
          timestamp,
        })

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  status: 'QualifiedDraft' as const,
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
      },

      assignEhsCoordinator: (projectId, ehsUserId, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        assertRole(
          actor,
          EHS_ASSIGN_ROLES,
          `Only ${humanizeRole('GovernanceLead')}, ${humanizeRole('AIProgramManager')}, or Admin can assign an EHS coordinator.`,
        )

        const timestamp = nowIso()
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  ehsCoordinatorId: ehsUserId,
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
      },

      approveSubmission: (projectId, actor, note) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        assertRole(
          actor,
          SUBMISSION_REVIEW_ROLES,
          `Only ${humanizeRole('GovernanceLead')}, ${humanizeRole('AIProgramManager')}, or Admin can approve submissions.`,
        )

        const nextStatus: ProjectStatus = project.ehsCoordinatorId
          ? 'ForEHSReview'
          : 'Active'
        assertStatusTransition(project.status, nextStatus)

        const timestamp = nowIso()
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: nextStatus === 'Active' ? 'Development' : project.currentStage,
          fromStatus: project.stageStatus[project.currentStage],
          toStatus:
            nextStatus === 'Active'
              ? 'InProgress'
              : project.stageStatus[project.currentStage],
          actorUserId: actor.id,
          actorRole: actor.role,
          note:
            note?.trim() ||
            (nextStatus === 'ForEHSReview'
              ? 'Submission approved — routed to EHS review.'
              : 'Submission approved — project activated (no EHS coordinator).'),
          timestamp,
        })

        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p
            if (nextStatus === 'Active') {
              return {
                ...p,
                ...activateProjectFields(p, timestamp),
                auditLog: [...p.auditLog, transition],
                updatedAt: timestamp,
              }
            }
            return {
              ...p,
              status: 'ForEHSReview' as const,
              auditLog: [...p.auditLog, transition],
              updatedAt: timestamp,
              lastActivityAt: timestamp,
            }
          }),
        }))
        const updated = get().projects.find((p) => p.id === projectId)
        if (updated) {
          if (nextStatus === 'ForEHSReview') {
            notify(updated, 'ehs-review-requested', actor)
          } else {
            notify(updated, 'approved', actor)
          }
        }
      },

      rejectSubmission: (projectId, reason, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        assertRole(
          actor,
          SUBMISSION_REVIEW_ROLES,
          `Only ${humanizeRole('GovernanceLead')}, ${humanizeRole('AIProgramManager')}, or Admin can reject submissions.`,
        )
        assertStatusTransition(project.status, 'Rejected')
        if (!reason.trim()) throw new Error('A rejection reason is required.')

        const timestamp = nowIso()
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: project.currentStage,
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: project.stageStatus[project.currentStage],
          actorUserId: actor.id,
          actorRole: actor.role,
          note: `Submission rejected: ${reason.trim()}`,
          timestamp,
        })

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  status: 'Rejected' as const,
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
        const updated = get().projects.find((p) => p.id === projectId)
        if (updated) notify(updated, 'rejected', actor)
      },

      ehsApprove: (projectId, actor, note) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        assertRole(
          actor,
          EHS_ACTION_ROLES,
          'Only EHS or Admin can approve EHS review.',
        )
        assertStatusTransition(project.status, 'Active')

        const timestamp = nowIso()
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: 'Development',
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: 'InProgress',
          actorUserId: actor.id,
          actorRole: actor.role,
          note: note?.trim() || 'EHS review approved — project activated.',
          timestamp,
        })

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  ...activateProjectFields(p, timestamp),
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                }
              : p,
          ),
        }))
        const updated = get().projects.find((p) => p.id === projectId)
        if (updated) notify(updated, 'ehs-approved', actor)
      },

      ehsReject: (projectId, reason, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        assertRole(
          actor,
          EHS_ACTION_ROLES,
          'Only EHS or Admin can reject EHS review.',
        )
        assertStatusTransition(project.status, 'EHSRejected')
        if (!reason.trim()) throw new Error('An EHS rejection reason is required.')

        const timestamp = nowIso()
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: project.currentStage,
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: project.stageStatus[project.currentStage],
          actorUserId: actor.id,
          actorRole: actor.role,
          note: `EHS rejected: ${reason.trim()}`,
          timestamp,
        })

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  status: 'EHSRejected' as const,
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
        const updated = get().projects.find((p) => p.id === projectId)
        if (updated) notify(updated, 'ehs-rejected', actor)
      },

      resubmitAfterRejection: (projectId, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canOwnStack(project, actor) && !canActOnClosureSubmit(actor, project)) {
          throw new Error(
            'Only the submitter, Data Engineering, AI Program Manager, or Admin can resubmit after rejection.',
          )
        }
        assertStatusTransition(project.status, 'Submitted')

        const timestamp = nowIso()
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: project.currentStage,
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: project.stageStatus[project.currentStage],
          actorUserId: actor.id,
          actorRole: actor.role,
          note: 'Revised and resubmitted after rejection.',
          timestamp,
        })

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  status: 'Submitted' as const,
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
      },

      logProjectReview: (projectId, note, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        assertRole(
          actor,
          PROJECT_REVIEW_ROLES,
          `Only ${humanizeRole('AIProgramManager')}, ${humanizeRole('GovernanceLead')}, or Admin can log a project review.`,
        )
        if (project.status !== 'Active') {
          throw new Error('Project reviews can only be logged while the project is Active.')
        }
        if (project.tier !== 'Tier2' && project.tier !== 'Tier3') {
          throw new Error('Separate project reviews apply to Tier2 and Tier3 only.')
        }
        if (!note.trim()) throw new Error('A project review note is required.')

        const timestamp = nowIso()
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: project.currentStage,
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: project.stageStatus[project.currentStage],
          actorUserId: actor.id,
          actorRole: actor.role,
          note: formatProjectReviewNote(note),
          timestamp,
        })

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
        const updated = get().projects.find((p) => p.id === projectId)
        if (updated) notify(updated, 'project-review-logged', actor)
      },

      submitForSponsorApproval: (projectId, payload, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canActOnClosureSubmit(actor, project)) {
          throw new Error(
            'Only the submitter, Data Engineering, AI Program Manager, or Admin can submit for sponsor approval.',
          )
        }
        assertStatusTransition(project.status, 'ForSponsorApproval')
        const hours = payload.reportedBenefitHours
        if (hours === null || hours === undefined || Number.isNaN(hours) || hours <= 0) {
          throw new Error('Report benefit hours before submitting for sponsor approval.')
        }

        const timestamp = nowIso()
        const nextSponsorId =
          payload.sponsorId !== undefined ? payload.sponsorId : project.sponsorId
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: 'Use',
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: 'InProgress',
          actorUserId: actor.id,
          actorRole: actor.role,
          note: `Submitted for sponsor approval with ${hours} reported benefit hours/month.`,
          timestamp,
        })

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  status: 'ForSponsorApproval' as const,
                  reportedBenefitHours: hours,
                  sponsorValidated: false,
                  sponsorDecision: null,
                  sponsorDecisionNote: '',
                  sponsorId: nextSponsorId ?? p.sponsorId,
                  currentStage: 'Use' as const,
                  stageStatus: {
                    ...p.stageStatus,
                    Use: 'InProgress',
                  },
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
        const updated = get().projects.find((p) => p.id === projectId)
        if (updated) notify(updated, 'sponsor-approval-requested', actor)
      },

      sponsorApprove: (projectId, actor, note) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canSponsorDecide(actor, project)) {
          throw new Error(
            'Only the assigned Sponsor or Admin can approve project closure.',
          )
        }
        assertStatusTransition(project.status, 'Completed')
        if (project.reportedBenefitHours === null) {
          throw new Error('Cannot approve closure without reported benefit hours.')
        }

        const timestamp = nowIso()
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: 'Use',
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: 'Completed',
          actorUserId: actor.id,
          actorRole: actor.role,
          note: note?.trim() || 'Sponsor approved — project completed.',
          timestamp,
        })

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  status: 'Completed' as const,
                  sponsorDecision: 'Approved' as const,
                  sponsorValidated: true,
                  currentStage: 'Use' as const,
                  stageStatus: {
                    ...p.stageStatus,
                    Use: 'Completed',
                  },
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
        const updated = get().projects.find((p) => p.id === projectId)
        if (updated) notify(updated, 'completed', actor)
      },

      sponsorDisapprove: (projectId, reason, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canSponsorDecide(actor, project)) {
          throw new Error(
            'Only the assigned Sponsor or Admin can disapprove project closure.',
          )
        }
        assertStatusTransition(project.status, 'Disapproved')
        if (!reason.trim()) throw new Error('A disapproval reason is required.')

        const timestamp = nowIso()
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: project.currentStage,
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: project.stageStatus[project.currentStage],
          actorUserId: actor.id,
          actorRole: actor.role,
          note: `Sponsor disapproved: ${reason.trim()}`,
          timestamp,
        })

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  status: 'Disapproved' as const,
                  sponsorDecision: 'Disapproved' as const,
                  sponsorDecisionNote: reason.trim(),
                  sponsorValidated: false,
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
        const updated = get().projects.find((p) => p.id === projectId)
        if (updated) notify(updated, 'disapproved', actor)
      },

      reviseAfterDisapproval: (projectId, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canActOnClosureSubmit(actor, project)) {
          throw new Error(
            'Only the submitter, Data Engineering, AI Program Manager, or Admin can revise after disapproval.',
          )
        }
        assertStatusTransition(project.status, 'Active')

        const timestamp = nowIso()
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: 'Development',
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: 'InProgress',
          actorUserId: actor.id,
          actorRole: actor.role,
          note: 'Revised after sponsor disapproval — returned to Active.',
          timestamp,
        })

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  status: 'Active' as const,
                  sponsorDecision: null,
                  sponsorDecisionNote: '',
                  currentStage: 'Development' as const,
                  stageStatus: {
                    ...p.stageStatus,
                    Development: 'InProgress',
                    Use: 'NotStarted',
                  },
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
      },

      updateProject: (projectId, patch) => {
        const timestamp = nowIso()
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? { ...project, ...patch, updatedAt: timestamp, lastActivityAt: timestamp }
              : project,
          ),
        }))
      },

      reportBenefits: (projectId, hours) => {
        const timestamp = nowIso()
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  reportedBenefitHours: hours,
                  sponsorValidated: false,
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : project,
          ),
        }))
      },

      runAging: () => {
        const now = getDemoNow()
        const timestamp = nowIso()
        const notifications: Array<{ project: Project; kind: Parameters<typeof notify>[1] }> = []

        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.status !== 'Active' && project.status !== 'Idle') return project

            const { phase, daysInactive } = computeAging(project, now)
            if (phase === 'active') return project

            // Active projects that are past the idle threshold always Idle first
            // (even if days also exceed alert/deactivate).
            if (project.status === 'Active' && (phase === 'idle' || phase === 'alert' || phase === 'deactivated')) {
              if (!shouldApplyAgingMilestone(project.agingMilestone, 'idle')) {
                return project
              }
              const transition = appendTransition(project, {
                fromStage: project.currentStage,
                toStage: project.currentStage,
                fromStatus: project.stageStatus[project.currentStage],
                toStatus: project.stageStatus[project.currentStage],
                actorUserId: AGING_SYSTEM_ACTOR.id,
                actorRole: AGING_SYSTEM_ACTOR.role,
                note: `Aged to Idle after ${daysInactive} days inactive.`,
                timestamp,
              })
              const next: Project = {
                ...project,
                status: 'Idle',
                agingMilestone: 'idle',
                updatedAt: timestamp,
                auditLog: [...project.auditLog, transition],
              }
              notifications.push({ project: next, kind: 'aging-idle' })
              return next
            }

            if (project.status === 'Active' && phase === 'reminder') {
              if (!shouldApplyAgingMilestone(project.agingMilestone, 'reminder')) {
                return project
              }
              const transition = appendTransition(project, {
                fromStage: project.currentStage,
                toStage: project.currentStage,
                fromStatus: project.stageStatus[project.currentStage],
                toStatus: project.stageStatus[project.currentStage],
                actorUserId: AGING_SYSTEM_ACTOR.id,
                actorRole: AGING_SYSTEM_ACTOR.role,
                note: `Aging reminder: ${daysInactive} days inactive.`,
                timestamp,
              })
              const next: Project = {
                ...project,
                agingMilestone: 'reminder',
                updatedAt: timestamp,
                auditLog: [...project.auditLog, transition],
              }
              notifications.push({ project: next, kind: 'aging-reminder' })
              return next
            }

            if (project.status === 'Idle' && phase === 'deactivated') {
              if (!shouldApplyAgingMilestone(project.agingMilestone, 'deactivated')) {
                return project
              }
              const transition = appendTransition(project, {
                fromStage: project.currentStage,
                toStage: project.currentStage,
                fromStatus: project.stageStatus[project.currentStage],
                toStatus: project.stageStatus[project.currentStage],
                actorUserId: AGING_SYSTEM_ACTOR.id,
                actorRole: AGING_SYSTEM_ACTOR.role,
                note: `Deactivated after ${daysInactive} days inactive.`,
                timestamp,
              })
              const next: Project = {
                ...project,
                status: 'Deactivated',
                agingMilestone: 'deactivated',
                updatedAt: timestamp,
                auditLog: [...project.auditLog, transition],
              }
              notifications.push({ project: next, kind: 'aging-deactivated' })
              return next
            }

            if (project.status === 'Idle' && phase === 'alert') {
              if (!shouldApplyAgingMilestone(project.agingMilestone, 'alert')) {
                return project
              }
              const transition = appendTransition(project, {
                fromStage: project.currentStage,
                toStage: project.currentStage,
                fromStatus: project.stageStatus[project.currentStage],
                toStatus: project.stageStatus[project.currentStage],
                actorUserId: AGING_SYSTEM_ACTOR.id,
                actorRole: AGING_SYSTEM_ACTOR.role,
                note: `Long-idle alert: ${daysInactive} days inactive.`,
                timestamp,
              })
              const next: Project = {
                ...project,
                agingMilestone: 'alert',
                updatedAt: timestamp,
                auditLog: [...project.auditLog, transition],
              }
              notifications.push({ project: next, kind: 'aging-alert' })
              return next
            }

            if (project.status === 'Idle' && phase === 'idle') {
              if (!shouldApplyAgingMilestone(project.agingMilestone, 'idle')) {
                return project
              }
              return { ...project, agingMilestone: 'idle' as AgingMilestone }
            }

            return project
          }),
        }))

        for (const item of notifications) {
          notify(item.project, item.kind, AGING_SYSTEM_ACTOR)
        }
      },

      reactivateProject: (projectId, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        assertStatusTransition(project.status, 'Active')

        const canReactivate =
          actor.role === 'Admin' ||
          actor.role === 'GovernanceLead' ||
          canActOnClosureSubmit(actor, project) ||
          canOwnStack(project, actor)
        if (!canReactivate) {
          throw new Error(
            'Only the submitter, owners, Governance Lead, or Admin can reactivate this project.',
          )
        }

        const timestamp = nowIso()
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: 'Development',
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: 'InProgress',
          actorUserId: actor.id,
          actorRole: actor.role,
          note: 'Project reactivated — aging clock reset.',
          timestamp,
        })

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  ...activateProjectFields(p, timestamp),
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                }
              : p,
          ),
        }))
        const updated = get().projects.find((p) => p.id === projectId)
        if (updated) notify(updated, 'reactivated', actor)
      },

      resetProjects: () => set({ projects: structuredClone(SEED_PROJECTS) }),
    }),
    {
      name: 'gcs-ai-portal-projects',
      partialize: (state) => ({ projects: state.projects }),
      merge: (persisted, current) => {
        const saved = persisted as { projects?: Project[] } | undefined
        if (!saved?.projects?.length) {
          return current
        }
        return { ...current, projects: saved.projects }
      },
    },
  ),
)
