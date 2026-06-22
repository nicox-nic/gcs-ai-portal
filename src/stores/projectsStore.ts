import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SEED_PROJECTS } from '@/data/seedProjects'
import {
  canActOnStage,
  getStageMeta,
  isAllowedTransition,
} from '@/lib/lifecycle'
import { humanizeRole } from '@/lib/utils'
import { useCatalogStore } from '@/stores/catalogStore'
import type {
  Group,
  LifecycleStage,
  Project,
  ProjectStatus,
  Recommendation,
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
}

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

function applyStatusSideEffects(
  project: Project,
  toStage: LifecycleStage,
  toStatus: StageStatus,
): ProjectStatus {
  let status = project.status

  if (toStage === 'Assessment' && toStatus === 'Completed' && status === 'Submitted') {
    status = 'Qualified'
  }
  if (toStatus === 'InProgress' && status === 'Qualified') {
    status = 'InProgress'
  }
  if (toStage === 'Use' && toStatus === 'Completed') {
    status = 'Completed'
  }
  if (toStage === 'Decommissioning' && toStatus === 'Completed') {
    status = 'Decommissioned'
  }

  return status
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
          status: 'Draft',
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
        }
        set((state) => ({ projects: [...state.projects, project] }))
        return project
      },

      submitProject: (projectId) => {
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project
            const transition = appendTransition(project, {
              fromStage: null,
              toStage: 'Assessment',
              fromStatus: null,
              toStatus: 'InProgress',
              actorUserId: project.submitterId,
              actorRole: 'Submitter',
              note: 'Project submitted for qualification.',
            })
            return {
              ...project,
              status: 'Submitted',
              currentStage: 'Assessment',
              stageStatus: {
                ...project.stageStatus,
                Assessment: 'InProgress',
              },
              auditLog: [...project.auditLog, transition],
              updatedAt: nowIso(),
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
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? { ...project, toolStack: stack, updatedAt: nowIso() }
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
            const transition = appendTransition(p, {
              fromStage,
              toStage,
              fromStatus,
              toStatus,
              actorUserId: actor.id,
              actorRole: actor.role,
              note,
            })
            const status = applyStatusSideEffects(p, toStage, toStatus)

            return {
              ...p,
              currentStage: toStage,
              stageStatus: { ...p.stageStatus, [toStage]: toStatus },
              status,
              auditLog: [...p.auditLog, transition],
              updatedAt: nowIso(),
            }
          }),
        }))
      },

      updateProject: (projectId, patch) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? { ...project, ...patch, updatedAt: nowIso() }
              : project,
          ),
        }))
      },

      reportBenefits: (projectId, hours) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  reportedBenefitHours: hours,
                  sponsorValidated: false,
                  updatedAt: nowIso(),
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
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, sponsorValidated: true, updatedAt: nowIso() }
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
