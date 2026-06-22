import type { SkillLevel, Training, TrainingAvailability, TrainingFormat, Tool } from '@/types'

export const TRAINING_CATALOG_LAST_UPDATED = 'Jun 1, 2026'
export const TRAININGS_PAGE_SIZE = 9

export const TRAINING_FORMATS: TrainingFormat[] = [
  'Self-paced',
  'Video',
  'Workshop',
  'Instructor-led',
]

export const TRAINING_SKILL_LEVELS: SkillLevel[] = [
  'None',
  'Basic',
  'Intermediate',
  'Advanced',
]

export type TrainingCatalogFilters = {
  search: string
  toolId: string | 'all'
  format: TrainingFormat | 'all'
  skillLevel: SkillLevel | 'all'
  availability: TrainingAvailability | 'all'
  provider: string
}

export const DEFAULT_TRAINING_FILTERS: TrainingCatalogFilters = {
  search: '',
  toolId: 'all',
  format: 'all',
  skillLevel: 'all',
  availability: 'all',
  provider: '',
}

export function hasActiveAdvancedFilters(filters: TrainingCatalogFilters): boolean {
  return filters.availability !== 'all' || filters.provider.trim().length > 0
}

export function hasAnyTrainingFilters(filters: TrainingCatalogFilters): boolean {
  return (
    filters.search.trim().length > 0 ||
    filters.toolId !== 'all' ||
    filters.format !== 'all' ||
    filters.skillLevel !== 'all' ||
    hasActiveAdvancedFilters(filters)
  )
}

export type FormatBadgeStyle = {
  bg: string
  text: string
  border?: string
}

export function formatBadgeStyle(
  format: TrainingFormat,
  muted = false,
): FormatBadgeStyle {
  if (muted) {
    return {
      bg: 'bg-stone-100',
      text: 'text-stone-500',
      border: 'border-[0.5px] border-stone-200',
    }
  }

  switch (format) {
    case 'Self-paced':
      return { bg: 'bg-[#EEEDFE]', text: 'text-[#3C3489]' }
    case 'Video':
      return { bg: 'bg-[#FEF3D0]', text: 'text-[#BA7517]' }
    case 'Workshop':
      return { bg: 'bg-[#F4E8F3]', text: 'text-[#6B4181]' }
    case 'Instructor-led':
      return { bg: 'bg-[#F4E8F3]', text: 'text-[#6B4181]' }
    default:
      return { bg: 'bg-stone-100', text: 'text-stone-600' }
  }
}

export function toolTagStyle(tool: Tool): { bg: string; text: string } {
  switch (tool.category) {
    case 'Conversational AI':
    case 'AI Assistant':
      return { bg: 'bg-indigo-50', text: 'text-indigo-900' }
    case 'Automation':
    case 'Content Management':
      return { bg: 'bg-green-50', text: 'text-green-900' }
    case 'Analytics':
    case 'Low-code':
      return { bg: 'bg-amber-50', text: 'text-amber-800' }
    case 'ML Platform':
    case 'Search & Retrieval':
      return { bg: 'bg-orange-50', text: 'text-orange-800' }
    default:
      return { bg: 'bg-stone-100', text: 'text-stone-600' }
  }
}

export function trainingToolTags(
  training: Training,
  tools: Tool[],
): { id: string; label: string; bg: string; text: string }[] {
  if (training.toolIds.length === 0) {
    return [{ id: 'all-tools', label: 'All tools', bg: 'bg-stone-100', text: 'text-stone-600' }]
  }

  return training.toolIds
    .map((toolId) => tools.find((tool) => tool.id === toolId))
    .filter((tool): tool is Tool => Boolean(tool))
    .map((tool) => {
      const style = toolTagStyle(tool)
      return { id: tool.id, label: tool.name, ...style }
    })
}

export function filterTrainings(
  trainings: Training[],
  filters: TrainingCatalogFilters,
): Training[] {
  const query = filters.search.trim().toLowerCase()

  return trainings.filter((training) => {
    if (query) {
      const haystack = `${training.title} ${training.description} ${training.provider}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }
    if (filters.toolId !== 'all' && !training.toolIds.includes(filters.toolId)) return false
    if (filters.format !== 'all' && training.format !== filters.format) return false
    if (filters.skillLevel !== 'all' && training.skillLevel !== filters.skillLevel) return false
    if (filters.availability !== 'all' && training.availability !== filters.availability) {
      return false
    }
    if (filters.provider.trim()) {
      const providerQuery = filters.provider.trim().toLowerCase()
      if (!training.provider.toLowerCase().includes(providerQuery)) return false
    }
    return true
  })
}

export function countAvailableTrainings(trainings: Training[]): number {
  return trainings.filter((training) => training.availability === 'Available').length
}

export type RecommendedStripItem = {
  training: Training
  forProject: boolean
}

export function buildRecommendedStrip(
  trainings: Training[],
  userToolIds: Set<string>,
  minCards = 4,
): RecommendedStripItem[] {
  const matched = trainings.filter(
    (training) =>
      training.availability === 'Available' &&
      training.toolIds.some((toolId) => userToolIds.has(toolId)),
  )

  const fillers = trainings.filter(
    (training) =>
      training.availability === 'Available' &&
      !matched.some((item) => item.id === training.id),
  )

  const items: RecommendedStripItem[] = matched.map((training) => ({
    training,
    forProject: true,
  }))

  for (const training of fillers) {
    if (items.length >= Math.max(minCards, matched.length)) break
    items.push({ training, forProject: false })
  }

  return items.slice(0, 8)
}

export function userProjectToolIds(
  projects: { submitterId: string; sponsorId: string | null; toolStack: { toolId: string }[] }[],
  userId: string,
): Set<string> {
  const toolIds = new Set<string>()
  for (const project of projects) {
    if (project.submitterId !== userId && project.sponsorId !== userId) continue
    for (const entry of project.toolStack) {
      toolIds.add(entry.toolId)
    }
  }
  return toolIds
}

export function userHasOwnedProjects(
  projects: { submitterId: string; sponsorId: string | null }[],
  userId: string,
): boolean {
  return projects.some(
    (project) => project.submitterId === userId || project.sponsorId === userId,
  )
}

export function buildPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, 'ellipsis', totalPages]
  }
  if (currentPage >= totalPages - 2) {
    return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }
  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages]
}
