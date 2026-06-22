import type { LucideIcon } from 'lucide-react'

type KpiCardProps = {
  icon: LucideIcon
  label: string
  value: string
  context: string
}

export function KpiCard({ icon: Icon, label, value, context }: KpiCardProps) {
  return (
    <div className="rounded-lg border-[0.5px] border-stone-200 bg-white p-4 transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] text-stone-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-[22px] font-medium text-stone-900">{value}</div>
      <div className="mt-1 text-[10px] text-stone-500">{context}</div>
    </div>
  )
}
