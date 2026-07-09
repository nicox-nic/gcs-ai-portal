import { useMemo } from 'react'
import { computeDashboardStats } from '@/lib/dashboardStats'
import { useAuthStore } from '@/stores/authStore'
import { useCatalogStore } from '@/stores/catalogStore'
import { useProjectsStore } from '@/stores/projectsStore'

export function useDashboardStats() {
  const projects = useProjectsStore((state) => state.projects)
  const tools = useCatalogStore((state) => state.tools)
  const currentUserId = useAuthStore((state) => state.currentUser?.id ?? null)

  return useMemo(
    () => computeDashboardStats(projects, tools, { currentUserId: currentUserId }),
    [projects, tools, currentUserId],
  )
}
