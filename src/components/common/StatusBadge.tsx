import { cn } from '@/lib/utils'
import type { ProjectStatus, StageStatus } from '@/types'

type StatusBadgeProps =
  | { kind: 'project'; status: ProjectStatus; className?: string }
  | { kind: 'stage'; status: StageStatus; className?: string }

function projectStatusLabel(status: ProjectStatus): string {
  const labels: Record<ProjectStatus, string> = {
    Draft: 'DRAFT',
    Submitted: 'SUBMITTED',
    Qualified: 'QUALIFIED',
    InProgress: 'IN PROGRESS',
    OnHold: 'ON HOLD',
    Completed: 'COMPLETED',
    Rejected: 'REJECTED',
    Decommissioned: 'DECOMMISSIONED',
  }
  return labels[status]
}

function stageStatusLabel(status: StageStatus): string {
  const labels: Record<StageStatus, string> = {
    NotStarted: 'NOT STARTED',
    InProgress: 'IN PROGRESS',
    Completed: 'COMPLETED',
    Blocked: 'BLOCKED',
  }
  return labels[status]
}

function statusVariant(
  status: ProjectStatus | StageStatus,
): string {
  switch (status) {
    case 'Completed':
    case 'Qualified':
      return 'bg-green-50 text-green-900 border-green-200'
    case 'InProgress':
      return 'bg-amber-50 text-amber-800 border-amber-200'
    case 'Submitted':
    case 'Draft':
    case 'NotStarted':
      return 'bg-stone-100 text-stone-600 border-stone-200'
    case 'Blocked':
    case 'Rejected':
      return 'bg-red-50 text-red-800 border-red-200'
    case 'OnHold':
      return 'bg-orange-50 text-orange-800 border-orange-200'
    case 'Decommissioned':
      return 'bg-stone-100 text-stone-700 border-stone-200'
    default:
      return 'bg-stone-100 text-stone-600 border-stone-200'
  }
}

export function StatusBadge(props: StatusBadgeProps) {
  const label =
    props.kind === 'project'
      ? projectStatusLabel(props.status)
      : stageStatusLabel(props.status)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border-[0.5px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        statusVariant(props.status),
        props.className,
      )}
    >
      {label}
    </span>
  )
}
