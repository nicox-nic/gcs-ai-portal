import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/uiStore'

type PageHeaderProps = {
  title: string
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  const setPageTitle = useUiStore((state) => state.setPageTitle)

  useEffect(() => {
    setPageTitle(title)
  }, [title, setPageTitle])

  return (
    <div className={cn('mb-5 flex items-start justify-between gap-4', className)}>
      <div>
        <h2 className="text-lg font-medium text-stone-900">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-stone-500">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
