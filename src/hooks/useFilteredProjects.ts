import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getStageMeta } from '@/lib/lifecycle'
import { PROJECT_STATUSES } from '@/lib/projectStatus'
import { useAuthStore } from '@/stores/authStore'
import { useProjectsStore } from '@/stores/projectsStore'
import type {
  Group,
  LifecycleStage,
  Project,
  ProjectStatus,
  ProjectTier,
  Role,
  Site,
} from '@/types'

export type ProjectFilters = {
  search: string
  status: ProjectStatus | 'all'
  stage: LifecycleStage | 'all'
  group: Group | 'all'
  site: Site | 'all'
  tier: ProjectTier | 'all'
  assignedSlot: 'ba' | 'de' | 'pm' | 'ms' | 'all'
  myProjectsOnly: boolean
}

export const DEFAULT_PROJECT_FILTERS: ProjectFilters = {
  search: '',
  status: 'all',
  stage: 'all',
  group: 'all',
  site: 'all',
  tier: 'all',
  assignedSlot: 'all',
  myProjectsOnly: false,
}

function matchesMyProjects(project: Project, userId: string, userRole: Role): boolean {
  if (project.submitterId === userId || project.sponsorId === userId) return true
  if (project.businessAnalystId === userId) return true
  if (project.dataEngineerId === userId) return true
  if (project.programManagerId === userId) return true
  if (project.maintenanceOwnerId === userId) return true
  const meta = getStageMeta(project.currentStage)
  return userRole === meta.primaryOwnerRole || meta.supportingRoles.includes(userRole)
}

function parseStatusParam(value: string | null): ProjectStatus | 'all' {
  if (!value || value === 'all') return 'all'
  return (PROJECT_STATUSES as string[]).includes(value) ? (value as ProjectStatus) : 'all'
}

function parseStageParam(value: string | null): LifecycleStage | 'all' {
  if (!value || value === 'all') return 'all'
  const stages: LifecycleStage[] = [
    'Assessment',
    'Policy',
    'SupplierOversight',
    'Development',
    'Deployment',
    'Use',
    'Improvement',
    'Decommissioning',
    'Enablement',
  ]
  return stages.includes(value as LifecycleStage) ? (value as LifecycleStage) : 'all'
}

function parseTierParam(value: string | null): ProjectTier | 'all' {
  if (!value || value === 'all') return 'all'
  if (value === 'Tier1' || value === 'Tier2' || value === 'Tier3') return value
  return 'all'
}

function parseAssignedSlot(
  value: string | null,
): ProjectFilters['assignedSlot'] {
  if (value === 'ba' || value === 'de' || value === 'pm' || value === 'ms') return value
  return 'all'
}

function matchesAssignedSlot(
  project: Project,
  slot: ProjectFilters['assignedSlot'],
  userId: string,
): boolean {
  if (slot === 'all') return true
  if (slot === 'ba') return project.businessAnalystId === userId
  if (slot === 'de') return project.dataEngineerId === userId
  if (slot === 'pm') return project.programManagerId === userId
  return project.maintenanceOwnerId === userId
}

export function useFilteredProjects() {
  const projects = useProjectsStore((state) => state.projects)
  const currentUser = useAuthStore((state) => state.currentUser)
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState<ProjectFilters>(() => ({
    ...DEFAULT_PROJECT_FILTERS,
    status: parseStatusParam(searchParams.get('status')),
    stage: parseStageParam(searchParams.get('stage')),
    tier: parseTierParam(searchParams.get('tier')),
    assignedSlot: parseAssignedSlot(searchParams.get('assigned')),
  }))

  useEffect(() => {
    const fromUrl = {
      status: parseStatusParam(searchParams.get('status')),
      stage: parseStageParam(searchParams.get('stage')),
      tier: parseTierParam(searchParams.get('tier')),
      assignedSlot: parseAssignedSlot(searchParams.get('assigned')),
    }
    setFilters((previous) => ({
      ...previous,
      ...fromUrl,
    }))
  }, [searchParams])

  const filteredProjects = useMemo(() => {
    const query = filters.search.trim().toLowerCase()

    return projects
      .filter((project) => {
        if (query && !project.title.toLowerCase().includes(query)) return false
        if (filters.status !== 'all' && project.status !== filters.status) return false
        if (filters.stage !== 'all' && project.currentStage !== filters.stage) return false
        if (filters.group !== 'all' && project.group !== filters.group) return false
        if (filters.site !== 'all' && project.site !== filters.site) return false
        if (filters.tier !== 'all' && project.tier !== filters.tier) return false
        if (
          filters.assignedSlot !== 'all' &&
          currentUser &&
          !matchesAssignedSlot(project, filters.assignedSlot, currentUser.id)
        ) {
          return false
        }
        if (
          filters.myProjectsOnly &&
          currentUser &&
          !matchesMyProjects(project, currentUser.id, currentUser.role)
        ) {
          return false
        }
        return true
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [projects, filters, currentUser])

  return { filters, setFilters, filteredProjects }
}
