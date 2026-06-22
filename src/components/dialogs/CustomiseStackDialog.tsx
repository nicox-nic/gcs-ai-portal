import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  ExternalLink,
  Info,
  Layers,
  Search,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toolIconFromHint, toolIconTileClasses } from '@/lib/toolIcons'
import {
  addToStack,
  getStackRole,
  promoteToPrimary,
  removeFromStack,
  updateUsageNote,
} from '@/lib/toolStack'
import { cn } from '@/lib/utils'
import { useCatalogStore } from '@/stores/catalogStore'
import { useProjectsStore } from '@/stores/projectsStore'
import type { SkillLevel, Submission, Tool, ToolStackEntry, Training } from '@/types'

const SKILL_RANK: Record<SkillLevel, number> = {
  None: 0,
  Basic: 1,
  Intermediate: 2,
  Advanced: 3,
}

const CATALOG_CATEGORY_ORDER = [
  'Conversational AI',
  'Automation',
  'Content Management',
  'Analytics',
  'ML Platform',
] as const

function catalogCategory(tool: Tool): (typeof CATALOG_CATEGORY_ORDER)[number] {
  switch (tool.category) {
    case 'AI Assistant':
    case 'Conversational AI':
      return 'Conversational AI'
    case 'Automation':
      return 'Automation'
    case 'Content Management':
      return 'Content Management'
    case 'Analytics':
    case 'Low-code':
      return 'Analytics'
    default:
      return 'ML Platform'
  }
}

function hasSkillGap(tool: Tool, submission: Submission): boolean {
  return (
    SKILL_RANK[tool.requiredSkillLevel] > SKILL_RANK[submission.skillLevelAvailable]
  )
}

type CustomiseStackDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectTitle: string
  submission: Submission
  initialStack: ToolStackEntry[]
}

export function CustomiseStackDialog({
  open,
  onOpenChange,
  projectId,
  projectTitle,
  submission,
  initialStack,
}: CustomiseStackDialogProps) {
  const tools = useCatalogStore((state) => state.tools)
  const trainings = useCatalogStore((state) => state.trainings)
  const updateToolStack = useProjectsStore((state) => state.updateToolStack)

  const [draftStack, setDraftStack] = useState<ToolStackEntry[]>(initialStack)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [editingNoteFor, setEditingNoteFor] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDraftStack(structuredClone(initialStack))
      setSearch('')
      setCategoryFilter('all')
      setEditingNoteFor(null)
    }
  }, [open, initialStack])

  const filteredTools = useMemo(() => {
    const query = search.trim().toLowerCase()
    return tools.filter((tool) => {
      const category = catalogCategory(tool)
      if (categoryFilter !== 'all' && category !== categoryFilter) return false
      if (!query) return true
      return (
        tool.name.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query)
      )
    })
  }, [tools, search, categoryFilter])

  const groupedTools = useMemo(() => {
    const groups = new Map<string, Tool[]>()
    for (const category of CATALOG_CATEGORY_ORDER) {
      groups.set(category, [])
    }
    for (const tool of filteredTools) {
      const category = catalogCategory(tool)
      groups.get(category)?.push(tool)
    }
    return CATALOG_CATEGORY_ORDER.map((category) => ({
      category,
      tools: groups.get(category) ?? [],
    })).filter((group) => group.tools.length > 0)
  }, [filteredTools])

  const stackTrainings = useMemo(() => {
    const toolIds = new Set(draftStack.map((entry) => entry.toolId))
    const seen = new Set<string>()
    const result: Training[] = []
    for (const training of trainings) {
      if (training.toolIds.some((id) => toolIds.has(id)) && !seen.has(training.id)) {
        seen.add(training.id)
        result.push(training)
      }
    }
    return result
  }, [draftStack, trainings])

  const primaryEntry = draftStack.find((entry) => entry.role === 'primary')
  const addOnEntries = draftStack.filter((entry) => entry.role === 'supporting')

  const handleCatalogClick = (toolId: string) => {
    const role = getStackRole(draftStack, toolId)
    if (!role) {
      setDraftStack(addToStack(draftStack, toolId))
      return
    }
    if (role === 'supporting') {
      setDraftStack(promoteToPrimary(draftStack, toolId))
      return
    }
    setDraftStack(removeFromStack(draftStack, toolId))
  }

  const handleSave = () => {
    try {
      updateToolStack(projectId, draftStack)
      toast.success('Tool stack saved.')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save stack.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
      >
        <div className="flex items-start justify-between border-b-[0.5px] border-stone-200 px-5 py-4">
          <div>
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <Layers className="h-4 w-4 text-indigo-600" />
              Customise Tool Stack
            </DialogTitle>
            <DialogDescription className="mt-1 text-[11px] text-stone-500">
              {projectTitle} — select one primary tool and any number of add-ons.
            </DialogDescription>
          </div>
          <button
            type="button"
            className="text-xl leading-none text-stone-400 hover:text-stone-700"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_260px]">
          <div className="min-h-0 overflow-y-auto border-b-[0.5px] border-stone-200 p-4 lg:border-b-0 lg:border-r-[0.5px]">
            <div className="mb-3.5 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-stone-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search tools…"
                  className="h-9 pl-8 text-xs"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 w-[140px] text-xs">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All categories
                  </SelectItem>
                  {CATALOG_CATEGORY_ORDER.map((category) => (
                    <SelectItem key={category} value={category} className="text-xs">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {groupedTools.map((group) => (
                <div key={group.category}>
                  <div className="mb-2 text-[10px] font-semibold tracking-wide text-stone-500 uppercase">
                    {group.category}
                  </div>
                  <div className="space-y-2">
                    {group.tools.map((tool) => {
                      const role = getStackRole(draftStack, tool.id)
                      const skillGap = hasSkillGap(tool, submission)
                      const Icon = toolIconFromHint(tool.iconHint)
                      const iconStyle = toolIconTileClasses(tool.iconHint)

                      return (
                        <button
                          key={tool.id}
                          type="button"
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors',
                            role === 'primary' &&
                              'border-2 border-indigo-600 bg-[#EEEDFE]',
                            role === 'supporting' &&
                              'border-[1.5px] border-[#1D9E75] bg-[#F0FBF6]',
                            !role &&
                              skillGap &&
                              'border-[0.5px] border-[#F9C89B] bg-[#FEF9F0] opacity-80',
                            !role &&
                              !skillGap &&
                              'border-[0.5px] border-stone-200 bg-white hover:bg-stone-50',
                          )}
                          onClick={() => handleCatalogClick(tool.id)}
                          onContextMenu={(event) => {
                            event.preventDefault()
                            setDraftStack(promoteToPrimary(draftStack, tool.id))
                          }}
                        >
                          <div
                            className={cn(
                              'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md',
                              iconStyle.tile,
                            )}
                          >
                            <Icon className={cn('h-4 w-4', iconStyle.icon)} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-stone-900">
                              {tool.name}
                              {skillGap && (
                                <span className="rounded border-[0.5px] border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[9px] text-orange-800">
                                  Skill gap
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-stone-500">
                              {tool.category} · {tool.requiredSkillLevel} ·{' '}
                              {tool.maxDataSensitivity}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {role === 'primary' && (
                              <span className="rounded bg-indigo-600 px-2 py-0.5 text-[9px] font-bold text-white">
                                PRIMARY
                              </span>
                            )}
                            {role === 'supporting' && (
                              <span className="rounded bg-[#1D9E75] px-2 py-0.5 text-[9px] font-bold text-white">
                                ADD-ON
                              </span>
                            )}
                            <div
                              className={cn(
                                'flex h-5 w-5 items-center justify-center rounded-full border',
                                role === 'primary' && 'border-indigo-600 bg-indigo-600 text-white',
                                role === 'supporting' && 'border-[#1D9E75] bg-[#1D9E75] text-white',
                                !role && 'border-stone-300 bg-white',
                              )}
                            >
                              {role && <Check className="h-3 w-3" />}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex min-h-[320px] flex-col bg-stone-100 p-4 lg:min-h-0">
            <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold text-stone-900">
              <Layers className="h-3.5 w-3.5 text-indigo-600" />
              Current Stack
              <span className="ml-auto flex h-[18px] w-[18px] items-center justify-center rounded-full bg-indigo-600 text-[10px] font-semibold text-white">
                {draftStack.length}
              </span>
            </div>

            <div className="mb-1.5 text-[10px] font-semibold tracking-wide text-stone-500 uppercase">
              Primary
            </div>
            {primaryEntry ? (
              (() => {
                const tool = tools.find((item) => item.id === primaryEntry.toolId)
                if (!tool) return null
                const Icon = toolIconFromHint(tool.iconHint)
                const iconStyle = toolIconTileClasses(tool.iconHint)
                return (
                  <div className="mb-3 flex items-center gap-2 rounded-md border-[1.5px] border-indigo-600 bg-white px-3 py-2.5">
                    <div
                      className={cn(
                        'flex h-[26px] w-[26px] items-center justify-center rounded-md',
                        iconStyle.tile,
                      )}
                    >
                      <Icon className={cn('h-3.5 w-3.5', iconStyle.icon)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-stone-900">{tool.name}</div>
                      <div className="text-[10px] text-stone-500">{tool.category}</div>
                    </div>
                    <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-900">
                      PRIMARY
                    </span>
                  </div>
                )
              })()
            ) : (
              <div className="mb-3 rounded-md border border-dashed border-stone-300 bg-white px-3 py-4 text-center text-[10px] text-stone-500">
                Select a primary tool from the catalog.
              </div>
            )}

            <div className="mb-1.5 text-[10px] font-semibold tracking-wide text-stone-500 uppercase">
              Add-ons
            </div>
            <div className="mb-3 space-y-1.5">
              {addOnEntries.length === 0 && (
                <div className="rounded-md border border-dashed border-stone-300 bg-white px-3 py-3 text-[10px] text-stone-500">
                  No add-ons selected.
                </div>
              )}
              {addOnEntries.map((entry) => {
                const tool = tools.find((item) => item.id === entry.toolId)
                if (!tool) return null
                const Icon = toolIconFromHint(tool.iconHint)
                const iconStyle = toolIconTileClasses(tool.iconHint)
                return (
                  <div
                    key={entry.toolId}
                    className="flex items-center gap-2 rounded-md border border-green-200 bg-white px-2.5 py-2"
                  >
                    <div
                      className={cn(
                        'flex h-[22px] w-[22px] items-center justify-center rounded-md',
                        iconStyle.tile,
                      )}
                    >
                      <Icon className={cn('h-3 w-3', iconStyle.icon)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-medium text-stone-900">{tool.name}</div>
                      {editingNoteFor === entry.toolId ? (
                        <Input
                          autoFocus
                          value={entry.usageNote ?? ''}
                          onChange={(event) =>
                            setDraftStack(
                              updateUsageNote(draftStack, entry.toolId, event.target.value),
                            )
                          }
                          onBlur={() => setEditingNoteFor(null)}
                          className="mt-1 h-7 text-[10px]"
                          placeholder="Role label (e.g. Knowledge store)"
                        />
                      ) : (
                        <button
                          type="button"
                          className="text-left text-[10px] text-stone-500 hover:text-stone-700"
                          onClick={() => setEditingNoteFor(entry.toolId)}
                        >
                          {entry.usageNote?.trim() || 'Add role label'}
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      className="text-stone-400 hover:text-stone-700"
                      onClick={() => setDraftStack(removeFromStack(draftStack, entry.toolId))}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="mb-3 rounded-md border-[0.5px] border-stone-200 bg-white p-3 text-[10px] text-stone-600">
              <div className="mb-1.5 flex items-center gap-1 font-medium text-stone-900">
                <Info className="h-3.5 w-3.5 text-indigo-600" />
                How to choose
              </div>
              <p className="mb-1">
                → <strong>Primary</strong> — the core tool driving the solution.
              </p>
              <p>
                → <strong>Add-on</strong> — supporting tools that extend or feed the primary.
              </p>
            </div>

            <div className="mt-auto">
              <div className="mb-1.5 text-[10px] font-semibold tracking-wide text-stone-500 uppercase">
                Trainings for this stack
              </div>
              <div className="space-y-1">
                {stackTrainings.length === 0 && (
                  <div className="rounded-md bg-white px-2 py-2 text-[10px] text-stone-500">
                    Add tools to see linked trainings.
                  </div>
                )}
                {stackTrainings.map((training) => (
                  <a
                    key={training.id}
                    href={training.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-md bg-white px-2 py-1.5 text-[10px] text-stone-800 hover:bg-stone-50"
                  >
                    <span className="truncate pr-2">{training.title}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 text-indigo-600" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t-[0.5px] border-stone-200 px-5 py-3">
          <Button
            type="button"
            variant="ghost"
            className="h-8 text-xs"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-stone-500">{draftStack.length} tools selected</span>
            <Button
              type="button"
              className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700"
              onClick={handleSave}
            >
              <Check className="h-3.5 w-3.5" />
              Save Stack
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
