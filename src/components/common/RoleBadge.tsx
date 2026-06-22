import { cn, humanizeRole } from '@/lib/utils'
import { ROLE_STYLES } from '@/lib/roleStyles'
import type { Role } from '@/types'

type RoleBadgeProps = {
  role: Role
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold',
        ROLE_STYLES[role].badge,
        className,
      )}
    >
      {humanizeRole(role)}
    </span>
  )
}
