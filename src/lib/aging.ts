import type { AgingMilestone, Project } from '@/types'

export const AGING_REMINDER_DAYS = 7
export const AGING_IDLE_DAYS = 14
export const AGING_ALERT_DAYS = 180
export const AGING_DEACTIVATE_DAYS = 187

export type AgingPhase = 'active' | 'reminder' | 'idle' | 'alert' | 'deactivated'

export type AgingResult = {
  phase: AgingPhase
  daysInactive: number
}

function daysBetween(fromIso: string, now: Date): number {
  const from = new Date(fromIso).getTime()
  const ms = now.getTime() - from
  return Math.floor(ms / 86400000)
}

/**
 * Compute aging phase from inactivity. Only meaningful for Active / Idle projects.
 */
export function computeAging(project: Project, now: Date): AgingResult {
  if (project.status !== 'Active' && project.status !== 'Idle') {
    return { phase: 'active', daysInactive: 0 }
  }

  const daysInactive = Math.max(0, daysBetween(project.lastActivityAt, now))

  if (daysInactive >= AGING_DEACTIVATE_DAYS) {
    return { phase: 'deactivated', daysInactive }
  }
  if (daysInactive >= AGING_ALERT_DAYS) {
    return { phase: 'alert', daysInactive }
  }
  if (daysInactive >= AGING_IDLE_DAYS) {
    return { phase: 'idle', daysInactive }
  }
  if (daysInactive >= AGING_REMINDER_DAYS) {
    return { phase: 'reminder', daysInactive }
  }
  return { phase: 'active', daysInactive }
}

const MILESTONE_RANK: Record<AgingMilestone, number> = {
  none: 0,
  reminder: 1,
  idle: 2,
  alert: 3,
  deactivated: 4,
}

export function milestoneForPhase(phase: AgingPhase): AgingMilestone {
  switch (phase) {
    case 'reminder':
      return 'reminder'
    case 'idle':
      return 'idle'
    case 'alert':
      return 'alert'
    case 'deactivated':
      return 'deactivated'
    default:
      return 'none'
  }
}

export function shouldApplyAgingMilestone(
  current: AgingMilestone | undefined,
  next: AgingMilestone,
): boolean {
  const from = current ?? 'none'
  return MILESTONE_RANK[next] > MILESTONE_RANK[from]
}
