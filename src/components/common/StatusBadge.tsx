import { cn } from '@/lib/utils'
import { humanizeProjectStatus, statusVariant as projectStatusVariant } from '@/lib/projectStatus'
import type { ProjectStatus, StageStatus } from '@/types'

type StatusBadgeProps =
  | { kind: 'project'; status: ProjectStatus; className?: string }
  | { kind: 'stage'; status: StageStatus; className?: string }

function stageStatusLabel(status: StageStatus): string {
  const labels: Record<StageStatus, string> = {
    NotStarted: 'NOT STARTED',
    InProgress: 'IN PROGRESS',
    Completed: 'COMPLETED',
    Blocked: 'BLOCKED',
  }
  return labels[status]
}

function stageStatusVariant(status: StageStatus): string {
  switch (status) {
    case 'Completed':
      return 'bg-green-50 text-green-900 border-green-200'
    case 'InProgress':
      return 'bg-amber-50 text-amber-800 border-amber-200'
    case 'NotStarted':
      return 'bg-stone-100 text-stone-600 border-stone-200'
    case 'Blocked':
      return 'bg-red-50 text-red-800 border-red-200'
    default:
      return 'bg-stone-100 text-stone-600 border-stone-200'
  }
}

export function StatusBadge(props: StatusBadgeProps) {
  const label =
    props.kind === 'project'
      ? humanizeProjectStatus(props.status)
      : stageStatusLabel(props.status)

  const variant =
    props.kind === 'project'
      ? projectStatusVariant(props.status)
      : stageStatusVariant(props.status)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border-[0.5px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        variant,
        props.className,
      )}
    >
      {label}
    </span>
  )
}
