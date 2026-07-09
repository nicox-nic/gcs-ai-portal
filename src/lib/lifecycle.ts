import type { LifecycleStage, Project, Role, StageStatus } from '@/types'

export type LifecycleStageMeta = {
  stage: LifecycleStage
  label: string
  order: number
  description: string
  primaryOwnerRole: Role
  supportingRoles: Role[]
}

export type StageTransitionOption = {
  toStage: LifecycleStage
  toStatus: StageStatus
  label: string
}

/** Sequential flow stages only — Enablement is cross-cutting and excluded. */
export const SEQUENTIAL_LIFECYCLE_STAGES: LifecycleStage[] = [
  'Assessment',
  'Policy',
  'SupplierOversight',
  'Development',
  'Deployment',
  'Use',
  'Improvement',
  'Decommissioning',
]

export const LIFECYCLE_STAGES: LifecycleStageMeta[] = [
  {
    stage: 'Assessment',
    label: 'Assessment',
    order: 1,
    description:
      'Qualify the AI use case. Run the qualification checklist, readiness review, and risk & impact assessment.',
    primaryOwnerRole: 'GovernanceLead',
    supportingRoles: ['BusinessAnalyst', 'RiskCompliance'],
  },
  {
    stage: 'Policy',
    label: 'Policy',
    order: 2,
    description:
      'Confirm or update the policy controls that apply to this project and determine the AI risk tier.',
    primaryOwnerRole: 'GovernanceLead',
    supportingRoles: ['RiskCompliance'],
  },
  {
    stage: 'SupplierOversight',
    label: 'Supplier Oversight',
    order: 3,
    description:
      'Govern supplier and third-party AI use — contracts, NDAs, security review, and the Vendor AI-SAQ (31-question self-assessment) when the project uses an external AI vendor.',
    primaryOwnerRole: 'RiskCompliance',
    supportingRoles: ['AIProgramManager', 'DataEngineering'],
  },
  {
    stage: 'Development',
    label: 'Development',
    order: 4,
    description:
      'Build the solution — data preparation, model development, validation, and traceability.',
    primaryOwnerRole: 'DataEngineering',
    supportingRoles: ['BusinessAnalyst', 'AIProgramManager'],
  },
  {
    stage: 'Deployment',
    label: 'Deployment',
    order: 5,
    description:
      'Pre-production validation, control implementation, user training, and formal release.',
    primaryOwnerRole: 'AIProgramManager',
    supportingRoles: ['MaintenanceSustainability', 'DataEngineering', 'BusinessAnalyst'],
  },
  {
    stage: 'Use',
    label: 'Use',
    order: 6,
    description:
      'Day-to-day operation — performance monitoring, feedback, incident response, and model drift ownership (M&S).',
    primaryOwnerRole: 'MaintenanceSustainability',
    supportingRoles: ['RiskCompliance', 'DataEngineering'],
  },
  {
    stage: 'Improvement',
    label: 'Improvement',
    order: 7,
    description:
      'Address issues, drift, and new requirements through governed change management.',
    primaryOwnerRole: 'GovernanceLead',
    supportingRoles: ['DataEngineering', 'MaintenanceSustainability', 'BusinessAnalyst'],
  },
  {
    stage: 'Decommissioning',
    label: 'Decommissioning',
    order: 8,
    description:
      'Retire the AI solution and close data, governance, and operational obligations.',
    primaryOwnerRole: 'GovernanceLead',
    supportingRoles: ['MaintenanceSustainability', 'RiskCompliance'],
  },
  {
    stage: 'Enablement',
    label: 'Enablement',
    order: 9,
    description:
      'AI awareness, literacy, communications, and recognition — cross-cutting across all stages.',
    primaryOwnerRole: 'AIProgramManager',
    supportingRoles: ['BusinessAnalyst'],
  },
]

const STAGE_META_BY_STAGE = new Map(LIFECYCLE_STAGES.map((entry) => [entry.stage, entry]))

export function getStageMeta(stage: LifecycleStage): LifecycleStageMeta {
  const meta = STAGE_META_BY_STAGE.get(stage)
  if (!meta) {
    throw new Error(`Unknown lifecycle stage: ${stage}`)
  }
  return meta
}

export function canActOnStage(role: Role, stage: LifecycleStage): boolean {
  if (role === 'Admin') return true
  const meta = getStageMeta(stage)
  return role === meta.primaryOwnerRole || meta.supportingRoles.includes(role)
}

export function nextStage(currentStage: LifecycleStage): LifecycleStage | null {
  const index = SEQUENTIAL_LIFECYCLE_STAGES.indexOf(currentStage)
  if (index < 0 || index >= SEQUENTIAL_LIFECYCLE_STAGES.length - 1) {
    return null
  }
  return SEQUENTIAL_LIFECYCLE_STAGES[index + 1]
}

export function getAllowedTransitions(
  currentStage: LifecycleStage,
  currentStageStatus: StageStatus,
): StageTransitionOption[] {
  switch (currentStageStatus) {
    case 'NotStarted':
      return [
        {
          toStage: currentStage,
          toStatus: 'InProgress',
          label: 'Start this stage',
        },
      ]
    case 'InProgress':
      return [
        {
          toStage: currentStage,
          toStatus: 'Completed',
          label: 'Mark complete',
        },
        {
          toStage: currentStage,
          toStatus: 'Blocked',
          label: 'Mark blocked',
        },
      ]
    case 'Completed': {
      const upcoming = nextStage(currentStage)
      if (!upcoming) return []
      const nextMeta = getStageMeta(upcoming)
      return [
        {
          toStage: upcoming,
          toStatus: 'NotStarted',
          label: `Advance to ${nextMeta.label}`,
        },
      ]
    }
    case 'Blocked':
      return [
        {
          toStage: currentStage,
          toStatus: 'InProgress',
          label: 'Resume',
        },
        {
          toStage: currentStage,
          toStatus: 'NotStarted',
          label: 'Reset stage',
        },
      ]
    default:
      return []
  }
}

export function stageProgress(project: Project): { completed: number; total: number; pct: number } {
  const total = SEQUENTIAL_LIFECYCLE_STAGES.length
  const completed = SEQUENTIAL_LIFECYCLE_STAGES.filter(
    (stage) => project.stageStatus[stage] === 'Completed',
  ).length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  return { completed, total, pct }
}

export function isAllowedTransition(
  currentStage: LifecycleStage,
  currentStageStatus: StageStatus,
  toStage: LifecycleStage,
  toStatus: StageStatus,
): boolean {
  return getAllowedTransitions(currentStage, currentStageStatus).some(
    (option) => option.toStage === toStage && option.toStatus === toStatus,
  )
}
