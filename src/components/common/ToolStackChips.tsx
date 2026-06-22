import { cn } from '@/lib/utils'
import { toolIconFromHint } from '@/lib/toolIcons'
import type { Tool, ToolStackEntry } from '@/types'

type ToolStackChipsProps = {
  toolStack: ToolStackEntry[]
  tools: Tool[]
  size?: 'sm' | 'md'
  showLabels?: boolean
  className?: string
}

function resolveTool(toolId: string, tools: Tool[]): Tool | undefined {
  return tools.find((tool) => tool.id === toolId)
}

export function ToolStackChips({
  toolStack,
  tools,
  size = 'md',
  showLabels = false,
  className,
}: ToolStackChipsProps) {
  if (toolStack.length === 0) {
    return <span className="text-xs text-stone-500">No stack selected</span>
  }

  if (size === 'sm') {
    const primary = toolStack.find((entry) => entry.role === 'primary')
    const primaryTool = primary ? resolveTool(primary.toolId, tools) : undefined
    const addOnCount = toolStack.filter((entry) => entry.role === 'supporting').length
    const label = primaryTool
      ? addOnCount > 0
        ? `${primaryTool.name} +${addOnCount}`
        : primaryTool.name
      : 'Unknown stack'
    return <span className={cn('text-xs text-stone-700', className)}>{label}</span>
  }

  const primary = toolStack.find((entry) => entry.role === 'primary')
  const addOns = toolStack.filter((entry) => entry.role === 'supporting')

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {primary && (() => {
        const tool = resolveTool(primary.toolId, tools)
        if (!tool) return null
        const Icon = toolIconFromHint(tool.iconHint)
        return (
          <span className="inline-flex items-center gap-1 rounded-sm bg-indigo-600 px-2.5 py-1 text-[10px] font-medium text-white">
            <Icon className="h-3 w-3 shrink-0" />
            {tool.name}
          </span>
        )
      })()}
      {addOns.map((entry) => {
        const tool = resolveTool(entry.toolId, tools)
        if (!tool) return null
        return (
          <span key={entry.toolId} className="flex items-center gap-1.5">
            <span className="text-[10px] text-stone-400">+</span>
            <span className="inline-flex items-center gap-1 rounded-sm border-[0.5px] border-green-200 bg-green-50 px-2.5 py-1 text-[10px] text-green-900">
              {tool.name}
              {showLabels && entry.usageNote && (
                <span className="text-stone-500">· {entry.usageNote}</span>
              )}
            </span>
          </span>
        )
      })}
    </div>
  )
}
