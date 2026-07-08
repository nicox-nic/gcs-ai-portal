import type { Role } from '@/types'

export function getUserInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
  }
  return displayName.slice(0, 2).toUpperCase()
}

export type RoleStyle = { badge: string; avatar: string }

export const ROLE_STYLES: Record<Role, RoleStyle> = {
  GovernanceLead: {
    badge: 'bg-indigo-50 text-indigo-900',
    avatar: 'bg-indigo-50 text-indigo-900',
  },
  RiskCompliance: {
    badge: 'bg-red-50 text-red-800',
    avatar: 'bg-red-50 text-red-800',
  },
  DataEngineering: {
    badge: 'bg-blue-50 text-blue-800',
    avatar: 'bg-blue-50 text-blue-800',
  },
  BusinessAnalyst: {
    badge: 'bg-purple-50 text-purple-800',
    avatar: 'bg-purple-50 text-purple-800',
  },
  AIProgramManager: {
    badge: 'bg-amber-50 text-amber-800',
    avatar: 'bg-amber-50 text-amber-800',
  },
  MaintenanceSustainability: {
    badge: 'bg-green-50 text-green-900',
    avatar: 'bg-green-50 text-green-900',
  },
  Submitter: {
    badge: 'bg-stone-100 text-stone-600',
    avatar: 'bg-stone-100 text-stone-600',
  },
  Sponsor: {
    badge: 'bg-green-50 text-green-900',
    avatar: 'bg-green-50 text-green-900',
  },
  EHS: {
    badge: 'bg-green-50 text-green-900',
    avatar: 'bg-green-50 text-green-900',
  },
  Admin: {
    badge: 'bg-stone-100 text-stone-900',
    avatar: 'bg-stone-100 text-stone-900',
  },
}
