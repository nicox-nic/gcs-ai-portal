/**
 * Swap `LocalMirrorAdapter` for a `RemoteCiPortalAdapter` (real CI Portal API)
 * later without touching callers.
 */
import { SEED_USERS } from '@/data/seedRoles'
import { useProjectsStore } from '@/stores/projectsStore'
import type { CiPortalRecord, Project } from '@/types'

export interface CiPortalAdapter {
  list(): CiPortalRecord[]
  get(projectId: string): CiPortalRecord | null
}

function displayName(userId: string | null): string {
  if (!userId) return '—'
  return SEED_USERS.find((u) => u.id === userId)?.displayName ?? userId
}

function toRecord(project: Project): CiPortalRecord {
  return {
    ciId: project.id,
    projectName: project.title,
    status: project.status,
    rewardCategory: project.rewardCategory,
    tier: project.tier,
    submitterName: displayName(project.submitterId),
    leaderName: displayName(project.submitterId),
    sponsorName: displayName(project.sponsorId),
    group: project.group,
    site: project.site,
    createdAt: project.createdAt,
    activeSince: project.activeSince,
    lastActivityAt: project.lastActivityAt,
    reportedBenefitHours: project.reportedBenefitHours,
  }
}

export const LocalMirrorAdapter: CiPortalAdapter = {
  list() {
    return useProjectsStore.getState().projects.map(toRecord)
  },
  get(projectId) {
    const project = useProjectsStore.getState().projects.find((p) => p.id === projectId)
    return project ? toRecord(project) : null
  },
}

/** Single export — callers never know the source. */
export const ciPortal: CiPortalAdapter = LocalMirrorAdapter
