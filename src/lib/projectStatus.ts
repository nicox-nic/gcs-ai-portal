import type { LifecycleStage, ProjectStatus, ProjectTier, RiskLevel } from '@/types'

/**
 * V3 operational status pipeline — single source of truth for vocabulary,
 * display, transitions, and pre-Active stage anchoring.
 *
 * Architectural rule: ISO lifecycle (`currentStage` + `stageStatus`) stays
 * independently walkable under `Active`. `STATUS_STAGE_ANCHOR` only pins
 * pre-Active / terminal-lifecycle statuses; Active/closure statuses do not
 * force a stage.
 */

export const PROJECT_STATUSES: ProjectStatus[] = [
  'IdeaDraft',
  'ForAssessment',
  'NotQualified',
  'Cancelled',
  'Qualified',
  'QualifiedDraft',
  'Submitted',
  'Rejected',
  'ForEHSReview',
  'EHSRejected',
  'Active',
  'ForSponsorApproval',
  'Disapproved',
  'Completed',
  'Idle',
  'Deactivated',
]

export type StatusCategory = 'intake' | 'review' | 'active' | 'closure' | 'lifecycle'

export type StatusMeta = {
  label: string
  variant: string
  category: StatusCategory
}

export const STATUS_META: Record<ProjectStatus, StatusMeta> = {
  IdeaDraft: {
    label: 'IDEA DRAFT',
    variant: 'bg-stone-100 text-stone-600 border-stone-200',
    category: 'intake',
  },
  ForAssessment: {
    label: 'FOR ASSESSMENT',
    variant: 'bg-stone-100 text-stone-600 border-stone-200',
    category: 'intake',
  },
  NotQualified: {
    label: 'NOT QUALIFIED',
    variant: 'bg-red-50 text-red-800 border-red-200',
    category: 'intake',
  },
  Cancelled: {
    label: 'CANCELLED',
    variant: 'bg-stone-100 text-stone-700 border-stone-200',
    category: 'lifecycle',
  },
  Qualified: {
    label: 'QUALIFIED',
    variant: 'bg-green-50 text-green-900 border-green-200',
    category: 'intake',
  },
  QualifiedDraft: {
    label: 'QUALIFIED DRAFT',
    variant: 'bg-stone-100 text-stone-600 border-stone-200',
    category: 'intake',
  },
  Submitted: {
    label: 'SUBMITTED',
    variant: 'bg-stone-100 text-stone-600 border-stone-200',
    category: 'review',
  },
  Rejected: {
    label: 'REJECTED',
    variant: 'bg-red-50 text-red-800 border-red-200',
    category: 'review',
  },
  ForEHSReview: {
    label: 'FOR EHS REVIEW',
    variant: 'bg-amber-50 text-amber-800 border-amber-200',
    category: 'review',
  },
  EHSRejected: {
    label: 'EHS REJECTED',
    variant: 'bg-red-50 text-red-800 border-red-200',
    category: 'review',
  },
  Active: {
    label: 'ACTIVE',
    variant: 'bg-amber-50 text-amber-800 border-amber-200',
    category: 'active',
  },
  ForSponsorApproval: {
    label: 'FOR SPONSOR APPROVAL',
    variant: 'bg-amber-50 text-amber-800 border-amber-200',
    category: 'closure',
  },
  Disapproved: {
    label: 'DISAPPROVED',
    variant: 'bg-red-50 text-red-800 border-red-200',
    category: 'closure',
  },
  Completed: {
    label: 'COMPLETED',
    variant: 'bg-green-50 text-green-900 border-green-200',
    category: 'closure',
  },
  Idle: {
    label: 'IDLE',
    variant: 'bg-orange-50 text-orange-800 border-orange-200',
    category: 'lifecycle',
  },
  Deactivated: {
    label: 'DEACTIVATED',
    variant: 'bg-stone-100 text-stone-700 border-stone-200',
    category: 'lifecycle',
  },
}

const STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  IdeaDraft: ['ForAssessment', 'Cancelled'],
  ForAssessment: ['Qualified', 'NotQualified'],
  NotQualified: ['ForAssessment', 'Cancelled'],
  Cancelled: [],
  Qualified: ['QualifiedDraft', 'Submitted'],
  QualifiedDraft: ['Submitted'],
  Submitted: ['ForEHSReview', 'Active', 'Rejected'],
  Rejected: ['Submitted', 'Cancelled'],
  ForEHSReview: ['Active', 'EHSRejected'],
  EHSRejected: ['Submitted', 'Cancelled'],
  Active: ['ForSponsorApproval', 'Idle'],
  ForSponsorApproval: ['Completed', 'Disapproved'],
  Disapproved: ['Active', 'ForSponsorApproval'],
  Completed: [],
  Idle: ['Active', 'Deactivated'],
  Deactivated: ['Active'],
}

/**
 * Pre-Active statuses are anchored to Assessment. Deactivated anchors to
 * Decommissioning. Active / closure / Idle do not force a stage — the ISO
 * stage axis stays user-driven while the project is operationally Active.
 */
export const STATUS_STAGE_ANCHOR: Partial<Record<ProjectStatus, LifecycleStage>> = {
  IdeaDraft: 'Assessment',
  ForAssessment: 'Assessment',
  NotQualified: 'Assessment',
  Cancelled: 'Assessment',
  Qualified: 'Assessment',
  QualifiedDraft: 'Assessment',
  Submitted: 'Assessment',
  Rejected: 'Assessment',
  ForEHSReview: 'Assessment',
  EHSRejected: 'Assessment',
  Deactivated: 'Decommissioning',
}

export const RISK_BY_TIER: Record<ProjectTier, RiskLevel> = {
  Tier1: 'Low',
  Tier2: 'Medium',
  Tier3: 'High',
}

export const TIER_BY_RISK: Record<RiskLevel, ProjectTier> = {
  Low: 'Tier1',
  Medium: 'Tier2',
  High: 'Tier3',
}

export function getAllowedStatusTransitions(status: ProjectStatus): ProjectStatus[] {
  return STATUS_TRANSITIONS[status]
}

export function humanizeProjectStatus(status: ProjectStatus): string {
  return STATUS_META[status].label
}

export function statusVariant(status: ProjectStatus): string {
  return STATUS_META[status].variant
}
