import { clsx, type ClassValue } from 'clsx'
import { format, formatDistanceToNow } from 'date-fns'
import { twMerge } from 'tailwind-merge'
import type { LifecycleStage, Role } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(iso: string): string {
  return format(new Date(iso), 'MMM d, yyyy')
}

export function formatDateTime(iso: string): string {
  return format(new Date(iso), 'MMM d, yyyy, h:mm a')
}

/** Relative labels drift from DEMO_TODAY on long-lived demos — absolute dates in tooltips stay correct. */
export function formatRelative(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true })
}

export function humanizeRole(role: Role): string {
  const labels: Record<Role, string> = {
    Submitter: 'Submitter',
    BusinessAnalyst: 'Business Analyst',
    GovernanceLead: 'Governance Lead',
    RiskCompliance: 'Risk & Compliance',
    DataEngineering: 'Data Engineering',
    AIProgramManager: 'AI Program Manager',
    MaintenanceSustainability: 'Maintenance & Sustainability',
    Sponsor: 'Sponsor',
    EHS: 'EHS',
    Admin: 'Admin',
  }
  return labels[role]
}

export function humanizeStage(stage: LifecycleStage): string {
  const labels: Record<LifecycleStage, string> = {
    Assessment: 'Assessment',
    Policy: 'Policy',
    SupplierOversight: 'Supplier Oversight',
    Development: 'Development',
    Deployment: 'Deployment',
    Use: 'Use',
    Improvement: 'Improvement',
    Decommissioning: 'Decommissioning',
    Enablement: 'Enablement',
  }
  return labels[stage]
}

export function roleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    Submitter: 'Submit ideas, track projects, and report benefits.',
    BusinessAnalyst: 'Refine submissions and support qualification.',
    GovernanceLead: 'Qualify projects, oversee gates, and run improvement.',
    RiskCompliance: 'Assess risk and sign off on suppliers.',
    DataEngineering: 'Build models and data pipelines.',
    AIProgramManager: 'Coordinate deployment and releases.',
    MaintenanceSustainability: 'Operate and sustain solutions post-deployment.',
    Sponsor: 'Approve at qualification and validate benefits at closure.',
    EHS: 'Review environmental, health, and safety controls before activation.',
    Admin: 'Manage tool, training, and combo catalogs.',
  }
  return descriptions[role]
}
