type HorizontalBarRowProps = {
  label: string
  percentage: number
  meta: string
  color: string
  maxPercentage?: number
}

export function HorizontalBarRow({
  label,
  percentage,
  meta,
  color,
  maxPercentage = 100,
}: HorizontalBarRowProps) {
  const width = maxPercentage > 0 ? Math.min((percentage / maxPercentage) * 100, 100) : 0

  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-stone-900">{label}</span>
        <span className="text-[11px] text-stone-600">
          {percentage}% <span className="text-stone-500">· {meta}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-sm bg-stone-100">
        <div
          className="h-full rounded-sm transition-all"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
