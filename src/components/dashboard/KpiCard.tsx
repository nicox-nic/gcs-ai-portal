import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type KpiCardProps = {
  icon: LucideIcon
  label: string
  value: string
  context: string
  onClick?: () => void
  className?: string
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  context,
  onClick,
  className,
}: KpiCardProps) {
  const interactive = Boolean(onClick)
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      className={cn(
        'rounded-lg border-[0.5px] border-stone-200 bg-white p-4 transition-shadow hover:shadow-md',
        interactive && 'cursor-pointer hover:border-indigo-200',
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-1.5 text-[11px] text-stone-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-[22px] font-medium text-stone-900">{value}</div>
      <div className="mt-1 text-[10px] text-stone-500">{context}</div>
    </div>
  )
}
