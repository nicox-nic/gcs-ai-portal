import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SEED_PROJECTS } from '@/data/seedProjects'
import {
  canActOnStage,
  getStageMeta,
  isAllowedTransition,
} from '@/lib/lifecycle'
import { canQualify } from '@/lib/qualificationLogic'
import { getAllowedStatusTransitions } from '@/lib/projectStatus'
import { humanizeRole } from '@/lib/utils'
import { useCatalogStore } from '@/stores/catalogStore'
import type {
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
  updateProject: (projectId: string, patch: Partial<Project>) => void
  reportBenefits: (projectId: string, hours: number) => void
  validateBenefits: (projectId: string) => void
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
  return new Date().toISOString()
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
 * Interim stage→status mappings until remaining gate screens land.
 * Completed arrives only from sponsor approval (Phase 5) — no Use→Completed auto-rule.
 * Qualification is explicit via qualifyProject (Phase 3) — no Assessment→Qualified auto-rule.
 */
function applyStatusSideEffects(
  project: Project,
  toStage: LifecycleStage,
  toStatus: StageStatus,
): Pick<Project, 'status' | 'activeSince' | 'lastActivityAt'> {
  let status = project.status
  let activeSince = project.activeSince
  const lastActivityAt = nowIso()

  // TODO(V3 Phase 4): gate Active behind EHS review instead of first post-Assessment stage
  const preActive: ProjectStatus[] = ['Qualified', 'QualifiedDraft', 'Submitted']
  if (
    toStage !== 'Assessment' &&
    toStatus === 'InProgress' &&
    preActive.includes(status)
  ) {
    status = 'Active'
    if (!activeSince) {
      activeSince = lastActivityAt
    }
  }

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
            return {
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
          }),
        }))
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

      validateBenefits: (projectId) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) {
          throw new Error(`Project not found: ${projectId}`)
        }
        if (project.reportedBenefitHours === null) {
          throw new Error('Cannot validate benefits before submitter reports hours')
        }
        const timestamp = nowIso()
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, sponsorValidated: true, updatedAt: timestamp, lastActivityAt: timestamp }
              : p,
          ),
        }))
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
