import type { Project, ProjectTier, Role, User } from '@/types'
import { RISK_BY_TIER } from '@/lib/projectStatus'

export type TierMeta = {
  label: string
  risk: 'Low' | 'Medium' | 'High'
  approach: string
  guidance: string
  badgeClass: string
}

/** Tier display + development guidance (Phase 5 overlay). */
export const TIER_META: Record<ProjectTier, TierMeta> = {
  Tier1: {
    label: 'Self-build',
    risk: RISK_BY_TIER.Tier1,
    approach: 'Self-build by the submitter with light Data Engineering support.',
    guidance:
      'Self-build path. Schedule an annual review of the solution’s fitness and controls.',
    badgeClass: 'border-green-200 bg-green-50 text-green-900',
  },
  Tier2: {
    label: 'Collaborative',
    risk: RISK_BY_TIER.Tier2,
    approach: 'Collaborative build with PM/BA involvement.',
    guidance:
      'Collaborative build with PM/BA. Log a separate project review checkpoint before closure.',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  Tier3: {
    label: 'Team-led',
    risk: RISK_BY_TIER.Tier3,
    approach: 'PM/team-led build; submitter is hands-off on the stack.',
    guidance:
      'Team-led build under the AI Program Manager. Log a separate project review checkpoint before closure.',
    badgeClass: 'border-red-200 bg-red-50 text-red-800',
  },
}

/**
 * Who may own/customise the tool stack for a given tier.
 * Tier1 includes the project submitter (self-build); Tier3 does not.
 */
export function getStackOwnerRoles(tier: ProjectTier | null): Role[] {
  switch (tier) {
    case 'Tier1':
      return ['Submitter', 'DataEngineering', 'Admin']
    case 'Tier2':
      return ['DataEngineering', 'AIProgramManager', 'BusinessAnalyst', 'Admin']
    case 'Tier3':
      return ['AIProgramManager', 'DataEngineering', 'Admin']
    default:
      // Pre-tier (Qualified without tier yet) — keep Phase-4 collaborative set
      return ['Submitter', 'DataEngineering', 'AIProgramManager', 'Admin']
  }
}

/** Tier-aware stack ownership. Tier1 also allows the project submitter by id. */
export function canOwnStack(project: Project, user: User | null): boolean {
  if (!user) return false
  if (user.role === 'Admin') return true

  const roles = getStackOwnerRoles(project.tier)

  if (project.tier === 'Tier1' && user.id === project.submitterId) {
    return true
  }

  if (roles.includes(user.role)) {
    // Tier3: Submitter role is not in the list — bare submitter excluded
    if (project.tier === 'Tier3' && user.id === project.submitterId && user.role === 'Submitter') {
      return false
    }
    // For Tier1, Submitter role in list only applies to the project submitter
    if (user.role === 'Submitter') {
      return user.id === project.submitterId
    }
    return true
  }

  // Null tier / Qualified: allow project submitter
  if (!project.tier && user.id === project.submitterId) {
    return true
  }

  return false
}

export const PROJECT_REVIEW_NOTE_PREFIX = '[Project Review]'

export function isProjectReviewEntry(note: string): boolean {
  return note.startsWith(PROJECT_REVIEW_NOTE_PREFIX)
}

export function formatProjectReviewNote(note: string): string {
  const trimmed = note.trim()
  if (trimmed.startsWith(PROJECT_REVIEW_NOTE_PREFIX)) return trimmed
  return `${PROJECT_REVIEW_NOTE_PREFIX} ${trimmed}`
}
