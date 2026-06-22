import type { Group, LifecycleStage, Project, Role, Site, Tool } from '@/types'
import { SEED_USERS } from '@/data/seedRoles'
import { GROUP_HEADCOUNT, SITE_HEADCOUNT } from '@/data/seedOrg'
import { ROLE_STYLES } from '@/lib/roleStyles'

const LIFECYCLE_STAGES: LifecycleStage[] = [
  'Assessment',
  'Policy',
  'SupplierOversight',
  'Development',
  'Deployment',
  'Use',
  'Improvement',
  'Decommissioning',
]

export const STAGE_CHART_LABELS: Record<LifecycleStage, string> = {
  Assessment: 'Assess',
  Policy: 'Policy',
  SupplierOversight: 'Supplier',
  Development: 'Develop',
  Deployment: 'Deploy',
  Use: 'Use',
  Improvement: 'Improve',
  Decommissioning: 'Decom.',
  Enablement: 'Enable',
}

export const GROUP_CHART_COLORS: Record<Group, string> = {
  Engineering: '#534AB7',
  PROGs: '#1D9E75',
  Field: '#6B8FBF',
  Marketing: '#D4537E',
}

export const SITE_CHART_COLORS: Record<Site, string> = {
  Japan: '#C53030',
  Korea: '#2B6CB0',
  'Costa Rica': '#1D9E75',
  Cebu: '#B58A2D',
}

export const CONTRIBUTOR_RANK_COLORS: Record<number, string> = {
  1: '#BA7517',
  2: '#888780',
  3: '#B07D4A',
}

export type LifecycleStageDatum = {
  stage: LifecycleStage
  label: string
  count: number
}

export type GroupRateDatum = {
  group: Group
  percentage: number
  numerator: number
  denominator: number
}

export type SiteRateDatum = {
  site: Site
  percentage: number
  numerator: number
  denominator: number
}

export type ToolUsageDatum = {
  toolId: string
  name: string
  count: number
}

export type ContributorDatum = {
  userId: string
  displayName: string
  group: Group
  role: Role
  count: number
}

export type ActivityDatum = {
  id: string
  actorName: string
  actorInitials: string
  actorGroup: Group
  actorAvatarClass: string
  projectTitle: string
  projectId: string
  summary: string
  timestamp: string
}

export type DashboardStats = {
  totalProjects: number
  inProgressCount: number
  completedCount: number
  hoursSaved: number
  pendingQualification: number
  awaitingValidation: number
  highRiskProjects: number
  lifecycleByStage: LifecycleStageDatum[]
  completionRateByGroup: GroupRateDatum[]
  adoptionByGroup: GroupRateDatum[]
  adoptionBySite: SiteRateDatum[]
  topTools: ToolUsageDatum[]
  topContributors: ContributorDatum[]
  recentActivity: ActivityDatum[]
}

function countBy<T extends string>(items: T[]): Record<T, number> {
  return items.reduce(
    (acc, item) => {
      acc[item] = (acc[item] ?? 0) + 1
      return acc
    },
    {} as Record<T, number>,
  )
}

function shortName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/)
  if (parts.length < 2) return displayName
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

function activitySummary(
  projectTitle: string,
  toStage: LifecycleStage,
  toStatus: string,
  note: string,
  fromStage: LifecycleStage | null,
): string {
  const lower = note.toLowerCase()
  if (lower.includes('validated') || lower.includes('benefits')) {
    return `validated benefits on ${projectTitle}`
  }
  if (lower.includes('blocked') || lower.includes('risk') || toStatus === 'Blocked') {
    return `flagged risk on ${projectTitle}`
  }
  if (fromStage === null || lower.includes('submitted')) {
    return `submitted ${projectTitle}`
  }
  if (lower.includes('qualified') || (toStage === 'Assessment' && toStatus === 'Completed')) {
    return `qualified ${projectTitle}`
  }
  return `moved ${projectTitle} to ${STAGE_CHART_LABELS[toStage] === 'Assess' ? 'Assessment' : toStage}`
}

const GROUP_AVATAR_STYLES: Record<Group, string> = {
  Engineering: 'bg-indigo-50 text-indigo-900',
  PROGs: 'bg-amber-50 text-amber-800',
  Field: 'bg-green-50 text-green-900',
  Marketing: 'bg-purple-50 text-purple-800',
}

function avatarClassForRole(role: Role | undefined, fallbackGroup: Group): string {
  if (role) return ROLE_STYLES[role].avatar
  return GROUP_AVATAR_STYLES[fallbackGroup]
}

export function computeDashboardStats(projects: Project[], tools: Tool[]): DashboardStats {
  const totalProjects = projects.length
  const inProgressCount = projects.filter((p) => p.status === 'InProgress').length
  const completedCount = projects.filter((p) => p.status === 'Completed').length
  const hoursSaved = projects
    .filter((p) => p.sponsorValidated && p.reportedBenefitHours !== null)
    .reduce((sum, p) => sum + (p.reportedBenefitHours ?? 0), 0)

  const pendingQualification = projects.filter(
    (p) => p.status === 'Submitted' && p.currentStage === 'Assessment',
  ).length

  const awaitingValidation = projects.filter(
    (p) =>
      p.status === 'Completed' &&
      p.reportedBenefitHours !== null &&
      !p.sponsorValidated,
  ).length

  const highRiskProjects = projects.filter(
    (p) =>
      p.status === 'OnHold' ||
      Object.values(p.stageStatus).some((status) => status === 'Blocked'),
  ).length

  const stageCounts = countBy(projects.map((p) => p.currentStage))
  const lifecycleByStage = LIFECYCLE_STAGES.map((stage) => ({
    stage,
    label: STAGE_CHART_LABELS[stage],
    count: stageCounts[stage] ?? 0,
  }))

  const groups: Group[] = ['Engineering', 'Field', 'PROGs', 'Marketing']
  const completionRateByGroup = groups
    .map((group) => {
      const groupProjects = projects.filter((p) => p.group === group)
      const denominator = groupProjects.filter(
        (p) => p.status !== 'Draft' && p.status !== 'Rejected',
      ).length
      const numerator = groupProjects.filter((p) => p.status === 'Completed').length
      const percentage = denominator > 0 ? Math.round((numerator / denominator) * 100) : 0
      return { group, percentage, numerator, denominator }
    })
    .sort((a, b) => b.percentage - a.percentage)

  const adoptionByGroup = groups
    .map((group) => {
      const numerator = projects.filter((p) => p.group === group).length
      const denominator = GROUP_HEADCOUNT[group]
      const percentage =
        denominator > 0 ? Math.round((numerator / denominator) * 100) : 0
      return { group, percentage, numerator, denominator }
    })
    .sort((a, b) => b.percentage - a.percentage)

  const sites: Site[] = ['Japan', 'Korea', 'Costa Rica', 'Cebu']
  const adoptionBySite = sites
    .map((site) => {
      const numerator = projects.filter((p) => p.site === site).length
      const denominator = SITE_HEADCOUNT[site]
      const percentage =
        denominator > 0 ? Math.round((numerator / denominator) * 100) : 0
      return { site, percentage, numerator, denominator }
    })
    .sort((a, b) => b.percentage - a.percentage)

  const primaryToolCounts = new Map<string, number>()
  for (const project of projects) {
    const primary = project.toolStack.find((entry) => entry.role === 'primary')
    if (primary) {
      primaryToolCounts.set(
        primary.toolId,
        (primaryToolCounts.get(primary.toolId) ?? 0) + 1,
      )
    }
  }

  const topTools = [...primaryToolCounts.entries()]
    .map(([toolId, count]) => ({
      toolId,
      name: tools.find((t) => t.id === toolId)?.name ?? toolId,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const contributorCounts = new Map<string, number>()
  for (const project of projects) {
    const participantIds = new Set<string>([project.submitterId])
    if (project.sponsorId) participantIds.add(project.sponsorId)
    for (const userId of participantIds) {
      contributorCounts.set(userId, (contributorCounts.get(userId) ?? 0) + 1)
    }
  }

  const topContributors = [...contributorCounts.entries()]
    .map(([userId, count]) => {
      const user = SEED_USERS.find((u) => u.id === userId)
      return {
        userId,
        displayName: user?.displayName ?? userId,
        group: user?.group ?? ('PROGs' as Group),
        role: user?.role ?? ('Submitter' as Role),
        count,
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const userById = new Map(SEED_USERS.map((u) => [u.id, u]))

  const recentActivity = projects
    .flatMap((project) =>
      project.auditLog.map((entry) => ({
        entry,
        project,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.entry.timestamp).getTime() - new Date(a.entry.timestamp).getTime(),
    )
    .slice(0, 5)
    .map(({ entry, project }) => {
      const actor = userById.get(entry.actorUserId)
      const displayName = actor?.displayName ?? 'Unknown user'
      return {
        id: entry.id,
        actorName: shortName(displayName),
        actorInitials: displayName
          .split(/\s+/)
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        actorGroup: actor?.group ?? project.group,
        actorAvatarClass: avatarClassForRole(actor?.role, project.group),
        projectTitle: project.title,
        projectId: project.id,
        summary: activitySummary(
          project.title,
          entry.toStage,
          entry.toStatus,
          entry.note,
          entry.fromStage,
        ),
        timestamp: entry.timestamp,
      }
    })

  return {
    totalProjects,
    inProgressCount,
    completedCount,
    hoursSaved,
    pendingQualification,
    awaitingValidation,
    highRiskProjects,
    lifecycleByStage,
    completionRateByGroup,
    adoptionByGroup,
    adoptionBySite,
    topTools,
    topContributors,
    recentActivity,
  }
}
