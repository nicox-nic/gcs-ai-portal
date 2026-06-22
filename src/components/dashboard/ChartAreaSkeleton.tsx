import { Skeleton } from '@/components/ui/skeleton'

export function ChartAreaSkeleton() {
  return (
    <div className="space-y-3 py-1" aria-hidden>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-3 w-24 shrink-0" />
          <Skeleton
            className="h-3 flex-1"
            style={{ maxWidth: `${88 - index * 8}%` }}
          />
          <Skeleton className="h-3 w-6 shrink-0" />
        </div>
      ))}
    </div>
  )
}
