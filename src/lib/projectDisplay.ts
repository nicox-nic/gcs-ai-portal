import { SEED_USERS } from '@/data/seedRoles'
import { STAGE_CHART_LABELS } from '@/lib/dashboardStats'
import type { LifecycleStage, Project, StageTransition, User } from '@/types'

export function getUserById(userId: string): User | undefined {
  return SEED_USERS.find((user) => user.id === userId)
}

export function getUserDisplayName(userId: string): string {
  return getUserById(userId)?.displayName ?? 'Unknown user'
}

export function shortActorName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/)
  if (parts.length < 2) return displayName
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

export function formatAuditAction(entry: StageTransition, projectTitle: string): string {
  const lower = entry.note.toLowerCase()
  if (lower.includes('validated') || lower.includes('benefits')) {
    return `validated benefits on ${projectTitle}`
  }
  if (lower.includes('blocked') || lower.includes('risk') || entry.toStatus === 'Blocked') {
    return `flagged risk on ${projectTitle}`
  }
  if (entry.fromStage === null || lower.includes('submitted')) {
    return `submitted ${projectTitle}`
  }
  if (lower.includes('qualified') || (entry.toStage === 'Assessment' && entry.toStatus === 'Completed')) {
    return `qualified ${projectTitle}`
  }
  if (entry.toStatus === 'InProgress' && entry.fromStatus !== 'InProgress') {
    return `started ${STAGE_CHART_LABELS[entry.toStage] ?? entry.toStage}`
  }
  if (entry.toStatus === 'Completed') {
    return `completed ${STAGE_CHART_LABELS[entry.toStage] ?? entry.toStage}`
  }
  return `moved ${projectTitle} to ${STAGE_CHART_LABELS[entry.toStage] ?? entry.toStage}`
}

export function recentAuditEntries(project: Project, limit = 4): StageTransition[] {
  return [...project.auditLog]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

export const STEPPER_STAGE_LABELS: Record<LifecycleStage, string> = {
  Assessment: 'Assess',
  Policy: 'Policy',
  SupplierOversight: 'Supplier',
  Development: 'Develop',
  Deployment: 'Deploy',
  Use: 'Use',
  Improvement: 'Improve',
  Decommissioning: 'Decom',
  Enablement: 'Enable',
}

export function stageStatusLabel(status: Project['stageStatus'][LifecycleStage]): string {
  switch (status) {
    case 'Completed':
      return 'Completed'
    case 'InProgress':
      return 'In Progress'
    case 'Blocked':
      return 'Blocked'
    default:
      return 'Not started'
  }
}
