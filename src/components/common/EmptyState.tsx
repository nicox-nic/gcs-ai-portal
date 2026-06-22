import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-[0.5px] border-dashed border-stone-200 bg-white px-6 py-12 text-center">
      <Icon className="mb-3 h-8 w-8 text-stone-400" />
      <h3 className="text-sm font-medium text-stone-900">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-stone-500">{description}</p>
      {action}
      {!action && actionLabel && onAction && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 h-8 text-xs"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
