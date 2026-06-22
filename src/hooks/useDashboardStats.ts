import { useMemo } from 'react'
import { computeDashboardStats } from '@/lib/dashboardStats'
import { useCatalogStore } from '@/stores/catalogStore'
import { useProjectsStore } from '@/stores/projectsStore'

export function useDashboardStats() {
  const projects = useProjectsStore((state) => state.projects)
  const tools = useCatalogStore((state) => state.tools)

  return useMemo(() => computeDashboardStats(projects, tools), [projects, tools])
}
