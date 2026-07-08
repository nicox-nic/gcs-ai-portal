import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getStageMeta } from '@/lib/lifecycle'
import { PROJECT_STATUSES } from '@/lib/projectStatus'
import { useAuthStore } from '@/stores/authStore'
import { useProjectsStore } from '@/stores/projectsStore'
import type { Group, LifecycleStage, Project, ProjectStatus, Role, Site } from '@/types'

export type ProjectFilters = {
  search: string
  status: ProjectStatus | 'all'
  stage: LifecycleStage | 'all'
  group: Group | 'all'
  site: Site | 'all'
  myProjectsOnly: boolean
}

export const DEFAULT_PROJECT_FILTERS: ProjectFilters = {
  search: '',
  status: 'all',
  stage: 'all',
  group: 'all',
  site: 'all',
  myProjectsOnly: false,
}

function matchesMyProjects(project: Project, userId: string, userRole: Role): boolean {
  if (project.submitterId === userId || project.sponsorId === userId) return true
  const meta = getStageMeta(project.currentStage)
  return userRole === meta.primaryOwnerRole || meta.supportingRoles.includes(userRole)
}

function parseStatusParam(value: string | null): ProjectStatus | 'all' {
  if (!value || value === 'all') return 'all'
  return (PROJECT_STATUSES as string[]).includes(value) ? (value as ProjectStatus) : 'all'
}

export function useFilteredProjects() {
  const projects = useProjectsStore((state) => state.projects)
  const currentUser = useAuthStore((state) => state.currentUser)
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState<ProjectFilters>(() => ({
    ...DEFAULT_PROJECT_FILTERS,
    status: parseStatusParam(searchParams.get('status')),
  }))

  useEffect(() => {
    const fromUrl = parseStatusParam(searchParams.get('status'))
    setFilters((previous) =>
      previous.status === fromUrl ? previous : { ...previous, status: fromUrl },
    )
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
