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
import {
  canAssignBusinessAnalyst,
  canCompleteDeployment,
  canCompleteDevelopment,
  canEditRequirements,
  canEditUat,
  deploymentGateBlockReason,
  developmentGateBlockReason,
  emptyRequirements,
  emptyUat,
  isBaGateMandatory,
  uatPassed,
} from '@/lib/baArtifacts'
import {
  canAssignDataEngineer,
  canAssignMaintenanceOwner,
  canAssignProgramManager,
} from '@/lib/deliverySlots'
import {
  canOperate,
  emptyOperations,
  hasOpenIncident,
  isDriftFlagged,
} from '@/lib/operations'
import {
  canCompleteSupplierOversight,
  canEditSaq,
  canSetUsesExternalVendor,
  emptySaq,
  isSaqRequired,
  supplierGateBlockReason,
} from '@/lib/vendorSaq'
import {
  canEditVerification,
  emptyVerification,
  outcomeFromChecks,
  verificationPassed,
} from '@/lib/verification'
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
  QualificationAssessment,
  ReadinessAssessment,
  Recommendation,
  RequirementsArtifact,
  RewardCategory,
  Site,
  StageStatus,
  StageTransition,
  Submission,
  ToolStackEntry,
  UatArtifact,
  User,
  HealthState,
  DriftState,
  IncidentSeverity,
  SaqArtifact,
  SaqOutcome,
  VerificationArtifact,
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
  /** Risk-rationale notes from Section D; delivery tier stays null until DE assigns. */
  tierRationale: string
  rewardCategory: RewardCategory
  businessAnalystId?: string | null
  dataEngineerId?: string | null
  programManagerId?: string | null
}

const QUALIFY_ROLES: User['role'][] = ['GovernanceLead', 'RiskCompliance', 'Admin']
const CANCEL_GOVERNANCE_ROLES: User['role'][] = ['GovernanceLead', 'RiskCompliance', 'Admin']
const SUBMISSION_REVIEW_ROLES: User['role'][] = [
  'GovernanceLead',
  'AIProgramManager',
  'Admin',
]
const EHS_ASSIGN_ROLES: User['role'][] = ['GovernanceLead', 'AIProgramManager', 'Admin']
/** Mirror canSponsorDecide: assigned coordinator when set; any EHS if unset. */
function canEhsDecide(actor: User, project: Project): boolean {
  if (actor.role === 'Admin') return true
  if (actor.role === 'EHS' && project.ehsCoordinatorId && actor.id === project.ehsCoordinatorId) {
    return true
  }
  if (actor.role === 'EHS' && !project.ehsCoordinatorId) return true
  return false
}
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
  assignBusinessAnalyst: (
    projectId: string,
    baUserId: string | null,
    actor: User,
  ) => void
  assignDataEngineer: (
    projectId: string,
    userId: string | null,
    actor: User,
  ) => void
  assignProgramManager: (
    projectId: string,
    userId: string | null,
    actor: User,
  ) => void
  assignMaintenanceOwner: (
    projectId: string,
    userId: string | null,
    actor: User,
  ) => void
  setHealthStatus: (projectId: string, health: HealthState, actor: User) => void
  logIncident: (
    projectId: string,
    payload: { severity: IncidentSeverity; summary: string; note: string },
    actor: User,
  ) => void
  closeIncident: (
    projectId: string,
    incidentId: string,
    note: string,
    actor: User,
  ) => void
  setDrift: (
    projectId: string,
    drift: DriftState,
    note: string,
    actor: User,
  ) => void
  recordUseReview: (projectId: string, note: string, actor: User) => void
  saveRequirements: (
    projectId: string,
    artifact: RequirementsArtifact,
    actor: User,
  ) => void
  confirmRequirements: (projectId: string, actor: User) => void
  saveUat: (projectId: string, artifact: UatArtifact, actor: User) => void
  signOffUat: (projectId: string, actor: User) => void
  saveVerification: (
    projectId: string,
    artifact: Pick<VerificationArtifact, 'checks' | 'notes' | 'outcome'>,
    actor: User,
  ) => void
  signOffVerification: (projectId: string, actor: User) => void
  setUsesExternalVendor: (projectId: string, value: boolean, actor: User) => void
  saveSaq: (
    projectId: string,
    artifact: Pick<SaqArtifact, 'answers' | 'notes' | 'outcome'>,
    actor: User,
  ) => void
  completeSaq: (projectId: string, outcome: SaqOutcome, actor: User) => void
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
    operations: project.operations ?? emptyOperations(),
  }
}

function emptyV3Fields(timestamp: string) {
  return {
    tier: null as Project['tier'],
    tierRationale: '',
    autoTiered: false,
    rewardCategory: null as Project['rewardCategory'],
    ehsCoordinatorId: null as string | null,
    businessAnalystId: null as string | null,
    dataEngineerId: null as string | null,
    programManagerId: null as string | null,
    maintenanceOwnerId: null as string | null,
    qualification: null as Project['qualification'],
    readiness: null as Project['readiness'],
    requirements: null as Project['requirements'],
    uat: null as Project['uat'],
    verification: null as Project['verification'],
    operations: null as Project['operations'],
    usesExternalVendor: false,
    vendorSaq: null as Project['vendorSaq'],
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

        if (
          currentStage === 'Development' &&
          toStage === 'Development' &&
          toStatus === 'Completed' &&
          !canCompleteDevelopment(project, actor)
        ) {
          throw new Error(
            developmentGateBlockReason(project) ??
              'Requirements must be confirmed before Development can complete.',
          )
        }

        if (
          currentStage === 'Deployment' &&
          toStage === 'Deployment' &&
          toStatus === 'Completed' &&
          !canCompleteDeployment(project, actor)
        ) {
          throw new Error(
            deploymentGateBlockReason(project) ??
              'UAT must Pass and be signed off before Deployment can complete.',
          )
        }

        if (
          currentStage === 'SupplierOversight' &&
          toStage === 'SupplierOversight' &&
          toStatus === 'Completed' &&
          !canCompleteSupplierOversight(project, actor)
        ) {
          throw new Error(
            supplierGateBlockReason(project) ??
              'Vendor AI-SAQ must be completed before Supplier Oversight can complete.',
          )
        }

        // Box so TS tracks mutation inside the set() callback.
        const pendingNotify: {
          current: { project: Project; kind: Parameters<typeof notify>[1] }[]
        } = { current: [] }

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

            const next: Project = {
              ...p,
              currentStage: toStage,
              stageStatus: { ...p.stageStatus, [toStage]: toStatus },
              ...sideEffects,
              auditLog: [...p.auditLog, transition],
              updatedAt: timestamp,
            }

            // Entering Development / Deployment with an assigned BA → request artifacts
            if (
              toStage === 'Development' &&
              fromStage !== 'Development' &&
              next.businessAnalystId
            ) {
              pendingNotify.current.push({ project: next, kind: 'requirements-requested' })
            }
            if (toStage === 'Development' && fromStage !== 'Development') {
              pendingNotify.current.push({ project: next, kind: 'development-started' })
            }
            if (
              toStage === 'Deployment' &&
              fromStage !== 'Deployment' &&
              next.businessAnalystId
            ) {
              pendingNotify.current.push({ project: next, kind: 'uat-requested' })
            }
            if (toStage === 'Deployment' && fromStage !== 'Deployment') {
              pendingNotify.current.push({ project: next, kind: 'deployment-started' })
              pendingNotify.current.push({ project: next, kind: 'verification-requested' })
            }
            if (
              toStage === 'SupplierOversight' &&
              fromStage !== 'SupplierOversight' &&
              isSaqRequired(next)
            ) {
              pendingNotify.current.push({ project: next, kind: 'saq-requested' })
            }

            return next
          }),
        }))

        for (const item of pendingNotify.current) {
          notify(item.project, item.kind, actor)
        }
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
            payload.rewardCategory,
          )
        ) {
          throw new Error(
            'Cannot qualify: at least one Section A criterion and a reward category are required.',
          )
        }
        if (!payload.qualification.riskTier) {
          throw new Error('Cannot qualify: Section D risk tier (Low/Medium/High) is required.')
        }

        const timestamp = nowIso()
        const riskTier = payload.qualification.riskTier
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: 'Policy',
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: 'NotStarted',
          actorUserId: actor.id,
          actorRole: actor.role,
          note:
            note ||
            `Qualified as AI project. Risk ${riskTier}; reward ${payload.rewardCategory}. Delivery tier not yet assigned. ${payload.tierRationale}`.trim(),
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
                    riskTier,
                  },
                  // Delivery-ownership tier is assigned later by DE — not at qualification.
                  tier: null,
                  tierRationale: payload.tierRationale,
                  rewardCategory: payload.rewardCategory,
                  autoTiered: false,
                  businessAnalystId:
                    payload.businessAnalystId !== undefined
                      ? payload.businessAnalystId
                      : p.businessAnalystId,
                  dataEngineerId:
                    payload.dataEngineerId !== undefined
                      ? payload.dataEngineerId
                      : p.dataEngineerId,
                  programManagerId:
                    payload.programManagerId !== undefined
                      ? payload.programManagerId
                      : p.programManagerId,
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
            notify(updated, 'go-live', actor)
            if (updated.businessAnalystId) {
              notify(updated, 'requirements-requested', actor)
            }
            notify(updated, 'development-started', actor)
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
        if (!canEhsDecide(actor, project)) {
          throw new Error(
            project.ehsCoordinatorId
              ? 'Only the assigned EHS coordinator or Admin can approve EHS review.'
              : 'Only EHS or Admin can approve EHS review.',
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
        if (updated) {
          notify(updated, 'ehs-approved', actor)
          notify(updated, 'go-live', actor)
          if (updated.businessAnalystId) {
            notify(updated, 'requirements-requested', actor)
          }
          notify(updated, 'development-started', actor)
        }
      },

      ehsReject: (projectId, reason, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canEhsDecide(actor, project)) {
          throw new Error(
            project.ehsCoordinatorId
              ? 'Only the assigned EHS coordinator or Admin can reject EHS review.'
              : 'Only EHS or Admin can reject EHS review.',
          )
        }
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
        if (isBaGateMandatory(project) && actor.role !== 'Admin') {
          const missing: string[] = []
          if (!uatPassed(project)) missing.push('passing BA-signed UAT')
          if (!verificationPassed(project)) missing.push('passing DE verification sign-off')
          if (missing.length > 0) {
            throw new Error(
              `Tier2/Tier3 projects require ${missing.join(' and ')} before sponsor approval.`,
            )
          }
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

      assignBusinessAnalyst: (projectId, baUserId, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canAssignBusinessAnalyst(actor)) {
          throw new Error(
            'Only Governance Lead, AI Program Manager, or Admin can assign a Business Analyst.',
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
          note: baUserId
            ? `Assigned Business Analyst: ${baUserId}.`
            : 'Cleared Business Analyst assignment.',
          timestamp,
        })
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  businessAnalystId: baUserId,
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
      },

      assignDataEngineer: (projectId, userId, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canAssignDataEngineer(actor, userId)) {
          throw new Error(
            'Only Governance Lead, AI Program Manager, Admin, or a Data Engineer claiming themselves can assign the Data Engineer.',
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
          note: userId
            ? `Assigned Data Engineer: ${userId}.`
            : 'Cleared Data Engineer assignment.',
          timestamp,
        })
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  dataEngineerId: userId,
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
      },

      assignProgramManager: (projectId, userId, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canAssignProgramManager(actor, userId)) {
          throw new Error(
            'Only Governance Lead, AI Program Manager, Admin, or a Program Manager claiming themselves can assign the Program Manager.',
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
          note: userId
            ? `Assigned Program Manager: ${userId}.`
            : 'Cleared Program Manager assignment.',
          timestamp,
        })
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  programManagerId: userId,
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
      },

      assignMaintenanceOwner: (projectId, userId, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canAssignMaintenanceOwner(actor, userId)) {
          throw new Error(
            'Only Governance Lead, AI Program Manager, Admin, or Maintenance & Sustainability claiming themselves can assign the Maintenance Owner.',
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
          note: userId
            ? `Assigned Maintenance Owner: ${userId}.`
            : 'Cleared Maintenance Owner assignment.',
          timestamp,
        })
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  maintenanceOwnerId: userId,
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
      },

      setHealthStatus: (projectId, health, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canOperate(project, actor)) {
          throw new Error(
            'Only the assigned Maintenance Owner, Admin, or M&S (when unassigned) can set health status.',
          )
        }
        if (hasOpenIncident(project) && health !== 'Incident') {
          throw new Error('Cannot set health while open incidents exist — close them first.')
        }
        const timestamp = nowIso()
        const ops = project.operations ?? emptyOperations()
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: project.currentStage,
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: project.stageStatus[project.currentStage],
          actorUserId: actor.id,
          actorRole: actor.role,
          note: `Health status set to ${health}.`,
          timestamp,
        })
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  operations: { ...ops, health },
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
      },

      logIncident: (projectId, payload, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canOperate(project, actor)) {
          throw new Error(
            'Only the assigned Maintenance Owner, Admin, or M&S (when unassigned) can log incidents.',
          )
        }
        if (!payload.summary.trim()) throw new Error('Incident summary is required.')
        const timestamp = nowIso()
        const ops = project.operations ?? emptyOperations()
        const incident = {
          id: `inc-${nanoid(6)}`,
          openedAt: timestamp,
          severity: payload.severity,
          summary: payload.summary.trim(),
          status: 'Open' as const,
          closedAt: null,
          note: payload.note.trim(),
        }
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: project.currentStage,
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: project.stageStatus[project.currentStage],
          actorUserId: actor.id,
          actorRole: actor.role,
          note: `Incident opened (${payload.severity}): ${payload.summary.trim()}`,
          timestamp,
        })
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  operations: {
                    ...ops,
                    health: 'Incident' as const,
                    incidents: [...ops.incidents, incident],
                  },
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
        const updated = get().projects.find((p) => p.id === projectId)
        if (updated) notify(updated, 'incident-opened', actor)
      },

      closeIncident: (projectId, incidentId, note, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canOperate(project, actor)) {
          throw new Error(
            'Only the assigned Maintenance Owner, Admin, or M&S (when unassigned) can close incidents.',
          )
        }
        const ops = project.operations ?? emptyOperations()
        const target = ops.incidents.find((i) => i.id === incidentId)
        if (!target || target.status !== 'Open') {
          throw new Error('Open incident not found.')
        }
        const timestamp = nowIso()
        const nextIncidents = ops.incidents.map((i) =>
          i.id === incidentId
            ? {
                ...i,
                status: 'Closed' as const,
                closedAt: timestamp,
                note: note.trim() ? `${i.note}${i.note ? ' · ' : ''}${note.trim()}` : i.note,
              }
            : i,
        )
        const stillOpen = nextIncidents.some((i) => i.status === 'Open')
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: project.currentStage,
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: project.stageStatus[project.currentStage],
          actorUserId: actor.id,
          actorRole: actor.role,
          note: `Incident closed: ${target.summary}${note.trim() ? ` — ${note.trim()}` : ''}`,
          timestamp,
        })
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  operations: {
                    ...ops,
                    incidents: nextIncidents,
                    health: stillOpen ? ('Incident' as const) : ('Watch' as const),
                  },
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
        const updated = get().projects.find((p) => p.id === projectId)
        if (updated) notify(updated, 'incident-closed', actor)
      },

      setDrift: (projectId, drift, note, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canOperate(project, actor)) {
          throw new Error(
            'Only the assigned Maintenance Owner, Admin, or M&S (when unassigned) can set drift.',
          )
        }
        const timestamp = nowIso()
        const ops = project.operations ?? emptyOperations()
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: project.currentStage,
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: project.stageStatus[project.currentStage],
          actorUserId: actor.id,
          actorRole: actor.role,
          note: `Drift set to ${drift}${note.trim() ? `: ${note.trim()}` : '.'}`,
          timestamp,
        })
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  operations: {
                    ...ops,
                    drift,
                    driftNote: note.trim(),
                  },
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
        const updated = get().projects.find((p) => p.id === projectId)
        if (updated && isDriftFlagged(drift)) {
          notify(updated, 'drift-flagged', actor)
        }
      },

      recordUseReview: (projectId, note, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canOperate(project, actor)) {
          throw new Error(
            'Only the assigned Maintenance Owner, Admin, or M&S (when unassigned) can record a Use review.',
          )
        }
        const timestamp = nowIso()
        const ops = project.operations ?? emptyOperations()
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: project.currentStage,
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: project.stageStatus[project.currentStage],
          actorUserId: actor.id,
          actorRole: actor.role,
          note: note.trim()
            ? `Use monitoring review: ${note.trim()}`
            : 'Use monitoring review recorded.',
          timestamp,
        })
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  operations: { ...ops, lastReviewedAt: timestamp },
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
      },

      saveRequirements: (projectId, artifact, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canEditRequirements(project, actor)) {
          throw new Error('Only the assigned Business Analyst or Admin can edit requirements.')
        }
        const timestamp = nowIso()
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  requirements: {
                    ...artifact,
                    // Editing clears prior confirm so BA must re-confirm
                    confirmedBy: null,
                    confirmedAt: null,
                  },
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
      },

      confirmRequirements: (projectId, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canEditRequirements(project, actor)) {
          throw new Error('Only the assigned Business Analyst or Admin can confirm requirements.')
        }
        const base = project.requirements ?? emptyRequirements()
        if (base.items.length < 1 && actor.role !== 'Admin') {
          throw new Error('Add at least one requirement before confirming.')
        }
        const timestamp = nowIso()
        const items =
          base.items.length > 0
            ? base.items
            : [
                {
                  id: `req-${nanoid(6)}`,
                  text: 'Self-attested requirements (Tier1 / Admin).',
                  priority: 'Must' as const,
                },
              ]
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: project.currentStage,
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: project.stageStatus[project.currentStage],
          actorUserId: actor.id,
          actorRole: actor.role,
          note: 'Requirements confirmed by Business Analyst.',
          timestamp,
        })
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  requirements: {
                    ...base,
                    items,
                    confirmedBy: actor.id,
                    confirmedAt: timestamp,
                  },
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
        const updated = get().projects.find((p) => p.id === projectId)
        if (updated) notify(updated, 'requirements-confirmed', actor)
      },

      saveUat: (projectId, artifact, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canEditUat(project, actor)) {
          throw new Error('Only the assigned Business Analyst or Admin can edit UAT.')
        }
        const timestamp = nowIso()
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  uat: {
                    ...artifact,
                    signedOffBy: null,
                    signedOffAt: null,
                  },
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
      },

      signOffUat: (projectId, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canEditUat(project, actor)) {
          throw new Error('Only the assigned Business Analyst or Admin can sign off UAT.')
        }
        const base = project.uat ?? emptyUat()
        if (base.outcome !== 'Pass' && actor.role !== 'Admin') {
          throw new Error('Set overall UAT outcome to Pass before signing off.')
        }
        if (base.cases.length < 1 && actor.role !== 'Admin') {
          throw new Error('Add at least one UAT case before signing off.')
        }
        const timestamp = nowIso()
        const cases =
          base.cases.length > 0
            ? base.cases
            : [
                {
                  id: `uat-${nanoid(6)}`,
                  description: 'Self-attested acceptance (Tier1 / Admin).',
                  result: 'Pass' as const,
                },
              ]
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: project.currentStage,
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: project.stageStatus[project.currentStage],
          actorUserId: actor.id,
          actorRole: actor.role,
          note: 'UAT signed off by Business Analyst (Pass).',
          timestamp,
        })
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  uat: {
                    ...base,
                    cases,
                    outcome: 'Pass',
                    signedOffBy: actor.id,
                    signedOffAt: timestamp,
                  },
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
        const updated = get().projects.find((p) => p.id === projectId)
        if (updated) notify(updated, 'uat-signed-off', actor)
      },

      saveVerification: (projectId, artifact, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canEditVerification(project, actor)) {
          throw new Error(
            'Only the assigned Data Engineer, Admin, or DE (when unassigned) can edit verification.',
          )
        }
        const timestamp = nowIso()
        const base = project.verification ?? emptyVerification()
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  verification: {
                    ...base,
                    checks: artifact.checks,
                    notes: artifact.notes,
                    outcome: artifact.outcome,
                    verifiedBy: null,
                    verifiedAt: null,
                  },
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
      },

      signOffVerification: (projectId, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canEditVerification(project, actor)) {
          throw new Error(
            'Only the assigned Data Engineer, Admin, or DE (when unassigned) can sign off verification.',
          )
        }
        const base = project.verification ?? emptyVerification()
        const checks =
          base.checks.length > 0
            ? base.checks
            : emptyVerification().checks.map((c) => ({ ...c, result: 'Pass' as const }))
        const outcome = outcomeFromChecks(checks)
        if (outcome === 'Fail') {
          // Allow signing Fail so remediation is recorded, but Deployment stays blocked.
        } else if (outcome !== 'Pass' && actor.role !== 'Admin') {
          throw new Error(
            'All verification checks must Pass (or mark Fail) before signing off. Tier1 may self-attest.',
          )
        }
        if (checks.length < 1 && actor.role !== 'Admin') {
          throw new Error('Add at least one verification check before signing off.')
        }
        const timestamp = nowIso()
        const finalOutcome = outcome === 'Pending' && actor.role === 'Admin' ? 'Pass' : outcome
        if (finalOutcome === 'Pending') {
          throw new Error('Complete all verification checks before signing off.')
        }
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: project.currentStage,
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: project.stageStatus[project.currentStage],
          actorUserId: actor.id,
          actorRole: actor.role,
          note: `DE verification signed off (${finalOutcome}).`,
          timestamp,
        })
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  verification: {
                    ...base,
                    checks,
                    outcome: finalOutcome,
                    verifiedBy: actor.id,
                    verifiedAt: timestamp,
                  },
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
        const updated = get().projects.find((p) => p.id === projectId)
        if (updated && finalOutcome === 'Pass') {
          notify(updated, 'verification-signed-off', actor)
        }
      },

      setUsesExternalVendor: (projectId, value, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canSetUsesExternalVendor(actor)) {
          throw new Error(
            'Only Risk & Compliance, Governance Lead, or Admin can set the third-party vendor flag.',
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
          note: value
            ? 'Marked as using third-party AI vendor (Vendor AI-SAQ required).'
            : 'Marked as internal-only (Vendor AI-SAQ not required).',
          timestamp,
        })
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  usesExternalVendor: value,
                  vendorSaq: value
                    ? (p.vendorSaq ?? emptySaq())
                    : p.vendorSaq,
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
        const updated = get().projects.find((p) => p.id === projectId)
        if (
          updated &&
          value &&
          updated.currentStage === 'SupplierOversight'
        ) {
          notify(updated, 'saq-requested', actor)
        }
      },

      saveSaq: (projectId, artifact, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canEditSaq(project, actor)) {
          throw new Error('Only Risk & Compliance or Admin can edit the Vendor AI-SAQ.')
        }
        const timestamp = nowIso()
        const base = project.vendorSaq ?? emptySaq()
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  usesExternalVendor: true,
                  vendorSaq: {
                    ...base,
                    answers: structuredClone(artifact.answers),
                    notes: artifact.notes,
                    outcome: artifact.outcome,
                    completedBy: null,
                    completedAt: null,
                  },
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
      },

      completeSaq: (projectId, outcome, actor) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) throw new Error(`Project not found: ${projectId}`)
        if (!canEditSaq(project, actor)) {
          throw new Error('Only Risk & Compliance or Admin can complete the Vendor AI-SAQ.')
        }
        if (outcome !== 'Pass' && outcome !== 'Fail' && outcome !== 'Waived') {
          throw new Error('SAQ outcome must be Pass, Fail, or Waived.')
        }
        const base = project.vendorSaq ?? emptySaq()
        if (base.answers.some((a) => a.response === null)) {
          throw new Error('Answer every SAQ question (Yes / No / N/A) before completing.')
        }
        if (outcome === 'Waived' && !base.notes.trim()) {
          throw new Error('Waive requires a justification note.')
        }
        const timestamp = nowIso()
        const transition = appendTransition(project, {
          fromStage: project.currentStage,
          toStage: project.currentStage,
          fromStatus: project.stageStatus[project.currentStage],
          toStatus: project.stageStatus[project.currentStage],
          actorUserId: actor.id,
          actorRole: actor.role,
          note: `Vendor AI-SAQ completed (${outcome}).`,
          timestamp,
        })
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  usesExternalVendor: true,
                  vendorSaq: {
                    ...base,
                    outcome,
                    completedBy: actor.id,
                    completedAt: timestamp,
                  },
                  auditLog: [...p.auditLog, transition],
                  updatedAt: timestamp,
                  lastActivityAt: timestamp,
                }
              : p,
          ),
        }))
        const updated = get().projects.find((p) => p.id === projectId)
        if (updated && (outcome === 'Pass' || outcome === 'Waived')) {
          notify(updated, 'saq-completed', actor)
        }
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
          actor.role === 'MaintenanceSustainability' ||
          canActOnClosureSubmit(actor, project) ||
          canOwnStack(project, actor)
        if (!canReactivate) {
          throw new Error(
            'Only the submitter, owners, Maintenance & Sustainability, Governance Lead, or Admin can reactivate this project.',
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
