import type {
  DriftState,
  HealthState,
  OperationsRecord,
  Project,
  User,
} from '@/types'

export function emptyOperations(): OperationsRecord {
  return {
    health: 'Healthy',
    incidents: [],
    drift: 'None',
    driftNote: '',
    lastReviewedAt: null,
  }
}

/**
 * Assigned M&S owner or Admin may operate.
 * If no owner assigned, any MaintenanceSustainability user may act (demo fallback).
 */
export function canOperate(project: Project, user: User | null): boolean {
  if (!user) return false
  if (user.role === 'Admin') return true
  if (project.maintenanceOwnerId) {
    return user.id === project.maintenanceOwnerId
  }
  return user.role === 'MaintenanceSustainability'
}

export function hasOpenIncident(project: Project): boolean {
  return (project.operations?.incidents ?? []).some((i) => i.status === 'Open')
}

export function openIncidentCount(project: Project): number {
  return (project.operations?.incidents ?? []).filter((i) => i.status === 'Open').length
}

/**
 * Effective health: auto-Incident while any open incident exists;
 * otherwise the stored health (default Healthy).
 */
export function deriveHealth(project: Project): HealthState {
  if (hasOpenIncident(project)) return 'Incident'
  return project.operations?.health ?? 'Healthy'
}

export function healthCiLabel(project: Project): string {
  if (!project.operations) return '—'
  const health = deriveHealth(project)
  const open = openIncidentCount(project)
  return open > 0 ? `${health} (${open} open)` : health
}

export function driftCiLabel(project: Project): string {
  if (!project.operations) return '—'
  return project.operations.drift
}

export function isDriftFlagged(drift: DriftState): boolean {
  return drift === 'Suspected' || drift === 'Confirmed'
}
