import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FolderKanban,
  ListTodo,
  Plus,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { ChartAreaSkeleton } from '@/components/dashboard/ChartAreaSkeleton'
import { HorizontalBarRow } from '@/components/dashboard/HorizontalBarRow'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { LifecycleStageChart } from '@/components/dashboard/LifecycleStageChart'
import { useHydrationReady } from '@/hooks/useHydrationReady'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import {
  CONTRIBUTOR_RANK_COLORS,
  GROUP_CHART_COLORS,
  SITE_CHART_COLORS,
  TIER_CHART_COLORS,
  type ActivityDatum,
  type ContributorDatum,
  type ToolUsageDatum,
} from '@/lib/dashboardStats'
import { ROLE_STYLES, getUserInitials } from '@/lib/roleStyles'
import { cn, formatRelative, humanizeRole } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import type { Role } from '@/types'

const SUBMIT_ROLES: Role[] = ['Submitter', 'BusinessAnalyst', 'Admin']

function DashboardCard({
  title,
  meta,
  children,
}: {
  title: string
  meta?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border-[0.5px] border-stone-200 bg-white p-4 transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-medium text-stone-900">{title}</h3>
        {meta && <span className="text-[10px] text-stone-500">{meta}</span>}
      </div>
      {children}
    </div>
  )
}

function RoleCallout() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.currentUser)
  const stats = useDashboardStats()

  if (!currentUser) return null

  let content: {
    text: string
    suffix: string
    className: string
    count: number
    icon: typeof ShieldCheck
  } | null = null

  if (currentUser.role === 'GovernanceLead' && stats.pendingQualification > 0) {
    content = {
      text: 'Pending qualification:',
      suffix: ' awaiting your review',
      count: stats.pendingQualification,
      className: 'border-indigo-200 bg-[#EEEDFE] text-indigo-900',
      icon: ShieldCheck,
    }
  } else if (currentUser.role === 'EHS' && stats.pendingEhsReview > 0) {
    content = {
      text: 'EHS review queue:',
      suffix: ' awaiting your clearance',
      count: stats.pendingEhsReview,
      className: 'border-amber-200 bg-amber-50 text-amber-900',
      icon: ShieldCheck,
    }
  } else if (currentUser.role === 'RiskCompliance' && stats.pendingQualification > 0) {
    content = {
      text: 'Pending qualification:',
      suffix: ' awaiting risk review',
      count: stats.pendingQualification,
      className: 'border-indigo-200 bg-[#EEEDFE] text-indigo-900',
      icon: ShieldCheck,
    }
  } else if (currentUser.role === 'Sponsor' && stats.awaitingValidation > 0) {
    content = {
      text: 'Awaiting your validation:',
      suffix: '',
      count: stats.awaitingValidation,
      className: 'border-green-200 bg-[#EAF3DE] text-green-900',
      icon: ShieldCheck,
    }
  } else if (
    currentUser.role === 'BusinessAnalyst' &&
    (stats.baRequirementsQueue > 0 || stats.baUatQueue > 0)
  ) {
    const parts: string[] = []
    if (stats.baRequirementsQueue > 0) {
      parts.push(
        `${stats.baRequirementsQueue} need${stats.baRequirementsQueue === 1 ? 's' : ''} requirements`,
      )
    }
    if (stats.baUatQueue > 0) {
      parts.push(`${stats.baUatQueue} need${stats.baUatQueue === 1 ? 's' : ''} UAT sign-off`)
    }
    content = {
      text: 'Your BA queue:',
      suffix: ` — ${parts.join('; ')}`,
      count: stats.baRequirementsQueue + stats.baUatQueue,
      className: 'border-indigo-200 bg-[#EEEDFE] text-indigo-900',
      icon: ShieldCheck,
    }
  } else if (
    (currentUser.role === 'GovernanceLead' ||
      currentUser.role === 'AIProgramManager' ||
      currentUser.role === 'Admin') &&
    stats.idleCount > 0
  ) {
    content = {
      text: 'Idle projects needing attention:',
      suffix: '',
      count: stats.idleCount,
      className: 'border-amber-200 bg-amber-50 text-amber-900',
      icon: Clock3,
    }
  } else if (currentUser.role === 'RiskCompliance' && stats.highRiskProjects > 0) {
    content = {
      text: 'High-risk projects:',
      suffix: '',
      count: stats.highRiskProjects,
      className: 'border-red-200 bg-[#FCEBEB] text-red-800',
      icon: AlertTriangle,
    }
  }

  if (!content) return null

  const Icon = content.icon

  const reviewPath =
    content.text.startsWith('Pending qualification')
      ? '/projects?status=ForAssessment'
      : content.text.startsWith('EHS review')
        ? '/projects?status=ForEHSReview'
        : content.text.startsWith('Idle')
          ? '/projects?status=Idle'
          : content.text.startsWith('Awaiting your validation')
            ? '/projects?status=ForSponsorApproval'
            : content.text.startsWith('Your BA queue')
              ? '/projects?status=Active'
              : '/projects'

  return (
    <div
      className={cn(
        'mb-3 flex items-center gap-2 rounded-md border-[0.5px] px-3.5 py-2.5 text-xs',
        content.className,
      )}
    >
      <span className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-current/15 bg-white/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
        <ListTodo className="h-3 w-3" aria-hidden />
        To do
      </span>
      <Icon className="h-4 w-4 shrink-0" />
      <span>
        <strong>{content.text}</strong> {content.count} project
        {content.count === 1 ? '' : 's'}
        {content.suffix}
      </span>
      <button
        type="button"
        className="ml-auto text-[11px] font-medium hover:underline"
        onClick={() => navigate(reviewPath)}
      >
        Review →
      </button>
    </div>
  )
}

function TopToolsList({ tools }: { tools: ToolUsageDatum[] }) {
  const maxCount = tools[0]?.count ?? 1

  return (
    <div className="space-y-2.5 text-[11px]">
      {tools.length === 0 && (
        <p className="text-xs text-stone-500">No primary tools in project stacks yet.</p>
      )}
      {tools.map((tool) => (
        <div key={tool.toolId} className="flex items-center gap-2">
          <span className="w-[100px] shrink-0 truncate text-stone-600">{tool.name}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-sm bg-stone-100">
            <div
              className="h-full rounded-sm bg-indigo-600"
              style={{ width: `${(tool.count / maxCount) * 100}%` }}
            />
          </div>
          <span className="w-[30px] shrink-0 text-right font-medium text-stone-900">
            {tool.count}
          </span>
        </div>
      ))}
    </div>
  )
}

function TopContributorsList({ contributors }: { contributors: ContributorDatum[] }) {
  return (
    <div className="text-[11px]">
      {contributors.length === 0 && (
        <p className="text-xs text-stone-500">No project contributors yet.</p>
      )}
      {contributors.map((contributor, index) => {
        const rank = index + 1
        return (
          <div
            key={contributor.userId}
            className="flex items-center gap-2.5 border-b-[0.5px] border-stone-200 py-1.5 last:border-b-0"
          >
            <div
              className="w-[18px] text-center font-medium"
              style={{ color: CONTRIBUTOR_RANK_COLORS[rank] ?? '#888780' }}
            >
              {rank}
            </div>
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-semibold',
                ROLE_STYLES[contributor.role].avatar,
              )}
            >
              {getUserInitials(contributor.displayName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-stone-900">{contributor.displayName}</div>
              <div className="text-[10px] text-stone-500">{contributor.group}</div>
            </div>
            <div className="font-medium text-stone-900">{contributor.count}</div>
          </div>
        )
      })}
    </div>
  )
}

function ActivityRow({ activity }: { activity: ActivityDatum }) {
  const title = activity.projectTitle
  const titleIndex = activity.summary.indexOf(title)
  const before = titleIndex >= 0 ? activity.summary.slice(0, titleIndex) : activity.summary
  const after = titleIndex >= 0 ? activity.summary.slice(titleIndex + title.length) : ''

  return (
    <div className="flex gap-2.5 border-b-[0.5px] border-stone-200 py-2.5 last:border-b-0">
      <div
        className={cn(
          'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[9px] font-semibold',
          activity.actorAvatarClass,
        )}
      >
        {activity.actorInitials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-stone-900">
          <strong>{activity.actorName}</strong> {before}
          {titleIndex >= 0 && (
            <Link
              to={`/projects/${activity.projectId}`}
              className="font-medium text-[#185FA5] hover:underline"
            >
              {title}
            </Link>
          )}
          {after}
        </p>
        <p className="mt-0.5 text-[10px] text-stone-500">
          {formatRelative(activity.timestamp)} · {activity.actorGroup}
        </p>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.currentUser)
  const stats = useDashboardStats()
  const chartsReady = useHydrationReady()

  const firstName = currentUser?.displayName.split(' ')[0] ?? 'there'
  const canSubmit = currentUser && SUBMIT_ROLES.includes(currentUser.role)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${firstName}. Here's what's happening across GCS AI projects.`}
        action={
          <div className="flex items-center gap-2">
            {currentUser && (
              <span className="rounded-sm bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-900">
                {humanizeRole(currentUser.role)} view
              </span>
            )}
            {canSubmit && (
              <Button
                asChild
                className="h-8 bg-indigo-600 px-3.5 text-xs hover:bg-indigo-700"
              >
                <Link to="/submit">
                  <Plus className="h-3.5 w-3.5" />
                  Submit New Project
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={FolderKanban}
          label="Total Projects"
          value={stats.totalProjects.toLocaleString()}
          context="Across all statuses"
        />
        <KpiCard
          icon={TrendingUp}
          label="Active"
          value={stats.inProgressCount.toLocaleString()}
          context="In build / use"
          onClick={() => navigate('/projects?status=Active')}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Completed"
          value={stats.completedCount.toLocaleString()}
          context="Validated by sponsor"
          onClick={() => navigate('/projects?status=Completed')}
        />
        <KpiCard
          icon={Clock3}
          label="Hours Saved"
          value={stats.hoursSaved.toLocaleString()}
          context="Per month, sponsor-validated"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {stats.queues.map((queue) => (
          <KpiCard
            key={queue.key}
            icon={ListTodo}
            label={queue.label}
            value={queue.count.toLocaleString()}
            context="Open queue"
            onClick={() => navigate(queue.href)}
          />
        ))}
      </div>

      <RoleCallout />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <DashboardCard title="Status Pipeline" meta="Counts by operational status">
          <div className="max-h-[220px] space-y-0 overflow-y-auto pr-1">
            {stats.statusPipeline
              .filter((row) => row.count > 0)
              .map((row) => {
                const max = Math.max(...stats.statusPipeline.map((s) => s.count), 1)
                return (
                  <HorizontalBarRow
                    key={row.status}
                    label={row.label}
                    percentage={Math.round((row.count / max) * 100)}
                    meta={`${row.count}`}
                    color="#534AB7"
                  />
                )
              })}
          </div>
        </DashboardCard>

        <DashboardCard title="Tier Distribution" meta="Among tiered projects">
          {stats.tierDistribution.map((row) => (
            <HorizontalBarRow
              key={row.tier}
              label={row.label}
              percentage={row.percentage}
              meta={`${row.count} project${row.count === 1 ? '' : 's'}`}
              color={TIER_CHART_COLORS[row.tier]}
            />
          ))}
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <DashboardCard title="Projects by Lifecycle Stage">
          {chartsReady ? (
            <LifecycleStageChart data={stats.lifecycleByStage} />
          ) : (
            <ChartAreaSkeleton />
          )}
        </DashboardCard>

        <DashboardCard title="Completion Rate by Group" meta="Completed / in pipeline">
          {stats.completionRateByGroup.map((row) => (
            <HorizontalBarRow
              key={row.group}
              label={row.group}
              percentage={row.percentage}
              meta={`${row.numerator} of ${row.denominator}`}
              color={GROUP_CHART_COLORS[row.group]}
            />
          ))}
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <DashboardCard title="AI Adoption by Group" meta="% of group with an AI project">
          {stats.adoptionByGroup.map((row) => (
            <HorizontalBarRow
              key={row.group}
              label={row.group}
              percentage={row.percentage}
              meta={`${row.numerator} of ${row.denominator.toLocaleString()}`}
              color={GROUP_CHART_COLORS[row.group]}
            />
          ))}
        </DashboardCard>

        <DashboardCard title="AI Adoption by Location" meta="% of site with an AI project">
          {stats.adoptionBySite.map((row) => (
            <HorizontalBarRow
              key={row.site}
              label={row.site}
              percentage={row.percentage}
              meta={`${row.numerator} of ${row.denominator.toLocaleString()}`}
              color={SITE_CHART_COLORS[row.site]}
            />
          ))}
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <DashboardCard title="Top Recommended Tools" meta="All projects">
          <TopToolsList tools={stats.topTools} />
        </DashboardCard>

        <DashboardCard title="Top Contributors" meta="By AI project count">
          <TopContributorsList contributors={stats.topContributors} />
        </DashboardCard>
      </div>

      <DashboardCard title="Recent Activity" meta="Last 5 transitions">
        {stats.recentActivity.length === 0 ? (
          <p className="text-xs text-stone-500">No recent transitions yet.</p>
        ) : (
          stats.recentActivity.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))
        )}
      </DashboardCard>
    </div>
  )
}
