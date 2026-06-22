import { cn } from '@/lib/utils'
import type { Group } from '@/types'

const GROUP_STYLES: Record<Group, string> = {
  Engineering: 'bg-indigo-50 text-indigo-700',
  PROGs: 'bg-green-50 text-green-800',
  Field: 'bg-sky-50 text-sky-800',
  Marketing: 'bg-pink-50 text-pink-700',
}

type GroupBadgeProps = {
  group: Group
  className?: string
}

export function GroupBadge({ group, className }: GroupBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold',
        GROUP_STYLES[group],
        className,
      )}
    >
      {group}
    </span>
  )
}
