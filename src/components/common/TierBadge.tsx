import { TIER_META } from '@/lib/tiering'
import { cn } from '@/lib/utils'
import type { ProjectTier } from '@/types'

type TierBadgeProps = {
  tier: ProjectTier
  className?: string
  compact?: boolean
}

export function TierBadge({ tier, className, compact = false }: TierBadgeProps) {
  const meta = TIER_META[tier]
  const label = compact ? tier : `${tier} · ${meta.label}`

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border-[0.5px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        meta.badgeClass,
        className,
      )}
      title={`${tier} · ${meta.label} · Risk ${meta.risk}`}
    >
      {label}
    </span>
  )
}
