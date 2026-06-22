import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { LifecycleStageDatum } from '@/lib/dashboardStats'

type LifecycleStageChartProps = {
  data: LifecycleStageDatum[]
}

export function LifecycleStageChart({ data }: LifecycleStageChartProps) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 8, fill: '#888780' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 9, fill: '#888780' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(83, 74, 183, 0.06)' }}
          contentStyle={{
            fontSize: 11,
            borderRadius: 6,
            border: '0.5px solid #E2E0D8',
          }}
        />
        <Bar dataKey="count" fill="#534AB7" radius={[2, 2, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  )
}
