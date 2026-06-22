import { Clock, ExternalLink, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  formatBadgeStyle,
  type RecommendedStripItem,
  trainingToolTags,
} from '@/lib/trainingCatalog'
import { cn } from '@/lib/utils'
import type { Tool, Training } from '@/types'

type RecommendedTrainingStripProps = {
  items: RecommendedStripItem[]
  tools: Tool[]
}

function StripCard({
  item,
  tools,
}: {
  item: RecommendedStripItem
  tools: Tool[]
}) {
  const { training, forProject } = item
  const formatStyle = formatBadgeStyle(training.format)
  const tags = trainingToolTags(training, tools)

  return (
    <div
      className={cn(
        'relative flex w-[200px] shrink-0 flex-col rounded-lg bg-white p-3',
        forProject ? 'border-2 border-indigo-600' : 'border-[0.5px] border-stone-200',
      )}
    >
      {forProject && (
        <div className="absolute -top-px right-2.5 rounded-b-md bg-indigo-600 px-2 py-0.5 text-[9px] font-semibold text-white">
          For your project
        </div>
      )}

      <div
        className={cn(
          'mb-1.5 flex items-start justify-between gap-2',
          forProject && 'mt-2',
        )}
      >
        <span
          className={cn(
            'rounded px-2 py-0.5 text-[9px] font-semibold',
            formatStyle.bg,
            formatStyle.text,
            formatStyle.border,
          )}
        >
          {training.format}
        </span>
        <span className="text-[10px] text-stone-500">{training.durationHours}h</span>
      </div>

      <h3 className="mb-1 line-clamp-2 text-[11px] leading-snug font-semibold text-stone-900">
        {training.title}
      </h3>
      <p className="mb-2 text-[10px] text-stone-500">
        {training.provider} · {training.skillLevel}
      </p>

      <div className="mb-2 flex flex-wrap gap-1">
        {tags.slice(0, 1).map((tag) => (
          <span
            key={tag.id}
            className={cn('rounded px-1.5 py-0.5 text-[9px]', tag.bg, tag.text)}
          >
            {tag.label}
          </span>
        ))}
      </div>

      <Button
        asChild
        variant={forProject ? 'default' : 'outline'}
        className={cn(
          'mt-auto h-7 w-full justify-center text-[10px]',
          forProject && 'bg-indigo-600 hover:bg-indigo-700',
        )}
      >
        <a href={training.url} target="_blank" rel="noreferrer">
          <ExternalLink className="h-3 w-3" />
          Open
        </a>
      </Button>
    </div>
  )
}

export function RecommendedTrainingStrip({ items, tools }: RecommendedTrainingStripProps) {
  if (items.length === 0) return null

  return (
    <section className="mb-5">
      <div className="mb-2.5 flex items-center gap-2 text-xs font-medium text-stone-900">
        <Sparkles className="h-4 w-4 text-[#BA7517]" />
        Recommended for you
        <span className="text-[10px] font-normal text-stone-500">
          — based on your active projects
        </span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1.5">
        {items.map((item) => (
          <StripCard key={item.training.id} item={item} tools={tools} />
        ))}
      </div>
    </section>
  )
}

type TrainingGridCardProps = {
  training: Training
  tools: Tool[]
}

export function TrainingGridCard({ training, tools }: TrainingGridCardProps) {
  const isComingSoon = training.availability === 'ComingSoon'
  const formatStyle = formatBadgeStyle(training.format, isComingSoon)
  const tags = trainingToolTags(training, tools)

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg p-3.5',
        isComingSoon
          ? 'border border-dashed border-stone-300 bg-stone-100 opacity-70'
          : 'border-[0.5px] border-stone-200 bg-white transition-all hover:-translate-y-px hover:shadow-md',
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span
          className={cn(
            'rounded px-2 py-0.5 text-[9px] font-semibold',
            formatStyle.bg,
            formatStyle.text,
            formatStyle.border,
          )}
        >
          {training.format}
        </span>
        <span className="text-[10px] text-stone-500">
          {training.durationHours}h · {training.skillLevel}
        </span>
      </div>

      <h3
        className={cn(
          'mb-1 line-clamp-2 text-xs leading-snug font-semibold',
          isComingSoon ? 'text-stone-500' : 'text-stone-900',
        )}
      >
        {training.title}
      </h3>
      <p className="mb-1.5 text-[10px] text-stone-500">{training.provider}</p>
      <p
        className={cn(
          'mb-2.5 line-clamp-3 flex-1 text-[11px] leading-relaxed',
          isComingSoon ? 'text-stone-400' : 'text-stone-600',
        )}
      >
        {training.description}
      </p>

      <div className="mb-2.5 flex flex-wrap gap-1">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className={cn(
              'rounded px-1.5 py-0.5 text-[9px]',
              isComingSoon ? 'bg-stone-200 text-stone-500' : tag.bg,
              !isComingSoon && tag.text,
            )}
          >
            {tag.label}
          </span>
        ))}
      </div>

      {isComingSoon ? (
        <button
          type="button"
          disabled
          className="flex h-8 w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-md border-[0.5px] border-stone-300 bg-transparent text-[11px] text-stone-500"
        >
          <Clock className="h-3.5 w-3.5" />
          {training.availableFromLabel ?? 'Coming soon'}
        </button>
      ) : (
        <Button
          asChild
          className="h-8 w-full justify-center bg-indigo-600 text-xs hover:bg-indigo-700"
        >
          <a href={training.url} target="_blank" rel="noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            Open training
          </a>
        </Button>
      )}
    </div>
  )
}
