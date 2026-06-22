import { useEffect, useMemo, useState } from 'react'
import { Filter, RefreshCw, Search, X } from 'lucide-react'
import {
  RecommendedTrainingStrip,
  TrainingGridCard,
} from '@/components/trainings/TrainingCatalogCards'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DEFAULT_TRAINING_FILTERS,
  TRAINING_CATALOG_LAST_UPDATED,
  TRAINING_FORMATS,
  TRAINING_SKILL_LEVELS,
  TRAININGS_PAGE_SIZE,
  buildPageNumbers,
  buildRecommendedStrip,
  countAvailableTrainings,
  filterTrainings,
  hasActiveAdvancedFilters,
  hasAnyTrainingFilters,
  userHasOwnedProjects,
  userProjectToolIds,
  type TrainingCatalogFilters,
} from '@/lib/trainingCatalog'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useCatalogStore } from '@/stores/catalogStore'
import { useProjectsStore } from '@/stores/projectsStore'
import type { SkillLevel, TrainingAvailability, TrainingFormat } from '@/types'

export function TrainingCatalogPage() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const trainings = useCatalogStore((state) => state.trainings)
  const tools = useCatalogStore((state) => state.tools)
  const projects = useProjectsStore((state) => state.projects)

  const [filters, setFilters] = useState<TrainingCatalogFilters>(DEFAULT_TRAINING_FILTERS)
  const [page, setPage] = useState(1)
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false)

  const availableCount = useMemo(() => countAvailableTrainings(trainings), [trainings])

  const filteredTrainings = useMemo(
    () => filterTrainings(trainings, filters),
    [trainings, filters],
  )

  useEffect(() => {
    setPage(1)
  }, [filters])

  const totalPages = Math.max(1, Math.ceil(filteredTrainings.length / TRAININGS_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const paginatedTrainings = filteredTrainings.slice(
    (currentPage - 1) * TRAININGS_PAGE_SIZE,
    currentPage * TRAININGS_PAGE_SIZE,
  )

  const showRecommended =
    currentUser !== null && userHasOwnedProjects(projects, currentUser.id)

  const recommendedItems = useMemo(() => {
    if (!currentUser) return []
    const toolIds = userProjectToolIds(projects, currentUser.id)
    return buildRecommendedStrip(trainings, toolIds)
  }, [currentUser, projects, trainings])

  const updateFilters = (patch: Partial<TrainingCatalogFilters>) => {
    setFilters((previous) => ({ ...previous, ...patch }))
  }

  return (
    <>
      <PageHeader
        title="Training Catalog"
        subtitle={`Curated learning paths for GCS AI tools and skills — ${availableCount} trainings available`}
        action={
          <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
            <RefreshCw className="h-3.5 w-3.5" />
            Last updated {TRAINING_CATALOG_LAST_UPDATED}
          </div>
        }
        className="mb-5"
      />

      {showRecommended && (
        <RecommendedTrainingStrip items={recommendedItems} tools={tools} />
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-stone-400" />
          <Input
            value={filters.search}
            onChange={(event) => updateFilters({ search: event.target.value })}
            placeholder="Search trainings…"
            className="h-9 pl-8 text-xs"
          />
        </div>

        <Select
          value={filters.toolId}
          onValueChange={(value) => updateFilters({ toolId: value })}
        >
          <SelectTrigger className="h-9 w-full text-xs sm:w-[140px]">
            <SelectValue placeholder="All tools" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All tools
            </SelectItem>
            {tools.map((tool) => (
              <SelectItem key={tool.id} value={tool.id} className="text-xs">
                {tool.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.format}
          onValueChange={(value) =>
            updateFilters({ format: value as TrainingFormat | 'all' })
          }
        >
          <SelectTrigger className="h-9 w-full text-xs sm:w-[140px]">
            <SelectValue placeholder="All formats" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All formats
            </SelectItem>
            {TRAINING_FORMATS.map((format) => (
              <SelectItem key={format} value={format} className="text-xs">
                {format}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filters.skillLevel !== 'all' ? (
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1 rounded-md border border-indigo-600 bg-indigo-50 px-3 text-xs text-indigo-900"
            onClick={() => updateFilters({ skillLevel: 'all' })}
          >
            {filters.skillLevel}
            <X className="h-3 w-3" />
          </button>
        ) : (
          <Select
            value={filters.skillLevel}
            onValueChange={(value) =>
              updateFilters({ skillLevel: value as SkillLevel | 'all' })
            }
          >
            <SelectTrigger className="h-9 w-full text-xs sm:w-[150px]">
              <SelectValue placeholder="All skill levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All skill levels
              </SelectItem>
              {TRAINING_SKILL_LEVELS.filter((level) => level !== 'None').map((level) => (
                <SelectItem key={level} value={level} className="text-xs">
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-9 text-xs',
            (moreFiltersOpen || hasActiveAdvancedFilters(filters)) &&
              'border-indigo-600 bg-indigo-50 text-indigo-900',
          )}
          aria-expanded={moreFiltersOpen}
          onClick={() => setMoreFiltersOpen((open) => !open)}
        >
          <Filter className="h-3.5 w-3.5" />
          More filters
        </Button>

        {hasAnyTrainingFilters(filters) && (
          <Button
            type="button"
            variant="ghost"
            className="h-9 text-xs text-stone-600"
            onClick={() => {
              setFilters(DEFAULT_TRAINING_FILTERS)
              setMoreFiltersOpen(false)
            }}
          >
            Clear all
          </Button>
        )}

        <span className="w-full text-[11px] text-stone-500 sm:ml-auto sm:w-auto">
          Showing {filteredTrainings.length} of {trainings.length}
        </span>
      </div>

      {moreFiltersOpen && (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border-[0.5px] border-stone-200 bg-white p-3">
          <div className="min-w-[160px] flex-1 space-y-1.5">
            <label htmlFor="training-filter-provider" className="text-[11px] font-medium text-stone-700">
              Provider
            </label>
            <Input
              id="training-filter-provider"
              value={filters.provider}
              onChange={(event) => updateFilters({ provider: event.target.value })}
              placeholder="e.g. Microsoft Learn"
              className="h-9 text-xs"
            />
          </div>

          <div className="min-w-[160px] space-y-1.5">
            <label htmlFor="training-filter-availability" className="text-[11px] font-medium text-stone-700">
              Availability
            </label>
            <Select
              value={filters.availability}
              onValueChange={(value) =>
                updateFilters({ availability: value as TrainingAvailability | 'all' })
              }
            >
              <SelectTrigger id="training-filter-availability" className="h-9 w-full text-xs">
                <SelectValue placeholder="All availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All availability
                </SelectItem>
                <SelectItem value="Available" className="text-xs">
                  Available
                </SelectItem>
                <SelectItem value="ComingSoon" className="text-xs">
                  Coming soon
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveAdvancedFilters(filters) && (
            <Button
              type="button"
              variant="ghost"
              className="h-9 text-xs text-stone-600"
              onClick={() =>
                updateFilters({ availability: 'all', provider: '' })
              }
            >
              Reset advanced filters
            </Button>
          )}
        </div>
      )}

      <div className="mb-2.5 text-[11px] font-semibold tracking-wide text-stone-500 uppercase">
        All Trainings
      </div>

      {paginatedTrainings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 bg-white px-6 py-12 text-center text-xs text-stone-500">
          No trainings match your filters.
        </div>
      ) : (
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {paginatedTrainings.map((training) => (
            <TrainingGridCard key={training.id} training={training} tools={tools} />
          ))}
        </div>
      )}

      {filteredTrainings.length > TRAININGS_PAGE_SIZE && (
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="h-8 text-xs disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            ← Prev
          </Button>

          {buildPageNumbers(currentPage, totalPages).map((item, index) =>
            item === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="text-[11px] text-stone-500">
                …
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                variant={item === currentPage ? 'default' : 'ghost'}
                className={cn(
                  'h-7 w-7 p-0 text-xs',
                  item === currentPage && 'bg-indigo-600 hover:bg-indigo-700',
                )}
                onClick={() => setPage(item)}
              >
                {item}
              </Button>
            ),
          )}

          <Button
            type="button"
            variant="ghost"
            className="h-8 text-xs disabled:opacity-50"
            disabled={currentPage === totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            Next →
          </Button>
        </div>
      )}
    </>
  )
}
