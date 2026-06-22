import type { ToolStackEntry } from '@/types'

export function isToolInStack(stack: ToolStackEntry[], toolId: string): boolean {
  return stack.some((entry) => entry.toolId === toolId)
}

export function getStackRole(
  stack: ToolStackEntry[],
  toolId: string,
): 'primary' | 'supporting' | null {
  return stack.find((entry) => entry.toolId === toolId)?.role ?? null
}

export function removeFromStack(stack: ToolStackEntry[], toolId: string): ToolStackEntry[] {
  const next = stack.filter((entry) => entry.toolId !== toolId)
  if (next.length === 0) return next
  if (!next.some((entry) => entry.role === 'primary')) {
    return next.map((entry, index) => ({
      ...entry,
      role: index === 0 ? ('primary' as const) : ('supporting' as const),
    }))
  }
  return next
}

export function promoteToPrimary(stack: ToolStackEntry[], toolId: string): ToolStackEntry[] {
  const existing = stack.find((entry) => entry.toolId === toolId)
  if (!existing) {
    return addToStack(stack, toolId)
  }

  return stack.map((entry) => {
    if (entry.toolId === toolId) {
      return { ...entry, role: 'primary' as const }
    }
    if (entry.role === 'primary') {
      return { ...entry, role: 'supporting' as const }
    }
    return entry
  }).sort((a, b) => {
    if (a.role === 'primary') return -1
    if (b.role === 'primary') return 1
    return 0
  })
}

export function addToStack(
  stack: ToolStackEntry[],
  toolId: string,
  usageNote?: string,
): ToolStackEntry[] {
  if (isToolInStack(stack, toolId)) {
    return stack
  }

  if (stack.length === 0 || !stack.some((entry) => entry.role === 'primary')) {
    return [{ toolId, role: 'primary', usageNote }]
  }

  return [...stack, { toolId, role: 'supporting', usageNote }]
}

export function comboMatchesStack(stack: ToolStackEntry[], combo: {
  primaryToolId: string
  addOnToolIds: string[]
}): boolean {
  if (stack.length === 0) return false
  const primary = stack.find((entry) => entry.role === 'primary')
  if (!primary || primary.toolId !== combo.primaryToolId) return false
  const stackAddOns = stack
    .filter((entry) => entry.role === 'supporting')
    .map((entry) => entry.toolId)
    .sort()
  const comboAddOns = [...combo.addOnToolIds].sort()
  return stackAddOns.length === comboAddOns.length &&
    stackAddOns.every((id, index) => id === comboAddOns[index])
}

export function updateUsageNote(
  stack: ToolStackEntry[],
  toolId: string,
  usageNote: string,
): ToolStackEntry[] {
  return stack.map((entry) =>
    entry.toolId === toolId ? { ...entry, usageNote } : entry,
  )
}
