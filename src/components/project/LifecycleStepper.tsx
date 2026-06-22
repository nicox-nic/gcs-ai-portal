import { Check, Play, Star } from 'lucide-react'
import { SEQUENTIAL_LIFECYCLE_STAGES } from '@/lib/lifecycle'
import { STEPPER_STAGE_LABELS, stageStatusLabel } from '@/lib/projectDisplay'
import { cn } from '@/lib/utils'
import type { LifecycleStage, Project, StageStatus } from '@/types'

type LifecycleStepperProps = {
  project: Project
}

const STAGE_COUNT = SEQUENTIAL_LIFECYCLE_STAGES.length
const TRACK_INSET_PERCENT = (0.5 / STAGE_COUNT) * 100

function stepVisual(status: StageStatus, isCurrent: boolean) {
  if (status === 'Completed') {
    return {
      circle: 'h-7 w-7 border-2 border-[#1D9E75] bg-[#1D9E75] text-white',
      label: 'text-[#1D9E75]',
      content: <Check className="h-3.5 w-3.5" />,
    }
  }
  if (status === 'Blocked') {
    return {
      circle: 'h-7 w-7 border-2 border-red-600 bg-red-50 text-red-700',
      label: 'text-red-700',
      content: <span className="text-[10px] font-semibold">!</span>,
    }
  }
  if (isCurrent && status === 'InProgress') {
    return {
      circle:
        'h-8 w-8 border-[2.5px] border-[#EF9F27] bg-[#FBEDD8] text-[#EF9F27] shadow-[0_0_0_4px_rgba(239,159,39,0.15)]',
      label: 'text-[#EF9F27] font-semibold',
      content: <Play className="h-3.5 w-3.5 fill-current" />,
    }
  }
  return {
    circle: 'h-7 w-7 border-[1.5px] border-stone-300 bg-stone-100 text-stone-500',
    label: 'text-stone-500',
    content: null,
  }
}

/** How far the green progress line extends along the track (0–100%). */
function progressPercent(project: Project): number {
  let lastCompletedIndex = -1
  for (let index = 0; index < STAGE_COUNT; index += 1) {
    const stage = SEQUENTIAL_LIFECYCLE_STAGES[index]
    if (project.stageStatus[stage] === 'Completed') {
      lastCompletedIndex = index
    }
  }

  if (lastCompletedIndex < 0) return 0
  if (lastCompletedIndex >= STAGE_COUNT - 1) return 100

  // Include the connector after the last completed stage (prev stage is done → link is green).
  const progressCenterIndex = lastCompletedIndex + 1
  const trackStart = TRACK_INSET_PERCENT
  const trackEnd = 100 - TRACK_INSET_PERCENT
  const trackLength = trackEnd - trackStart
  const progressEnd = ((progressCenterIndex + 0.5) / STAGE_COUNT) * 100

  return Math.min(100, Math.max(0, ((progressEnd - trackStart) / trackLength) * 100))
}

export function LifecycleStepper({ project }: LifecycleStepperProps) {
  const progress = progressPercent(project)

  return (
    <div>
      <div className="relative">
        {/* Continuous baseline — always visible so steps read as sequential */}
        <div
          className="pointer-events-none absolute top-4 h-[2px] -translate-y-1/2 bg-stone-300"
          style={{
            left: `${TRACK_INSET_PERCENT}%`,
            right: `${TRACK_INSET_PERCENT}%`,
          }}
          aria-hidden
        />

        {/* Completed progress overlay on the same track */}
        {progress > 0 && (
          <div
            className="pointer-events-none absolute top-4 h-[2px] -translate-y-1/2 bg-[#1D9E75]"
            style={{
              left: `${TRACK_INSET_PERCENT}%`,
              width: `${((100 - TRACK_INSET_PERCENT * 2) * progress) / 100}%`,
            }}
            aria-hidden
          />
        )}

        <div className="relative flex items-start">
          {SEQUENTIAL_LIFECYCLE_STAGES.map((stage, index) => {
            const status = project.stageStatus[stage]
            const isCurrent = project.currentStage === stage
            const visual = stepVisual(status, isCurrent)
            const stepNumber = index + 1

            return (
              <div key={stage} className="flex min-w-0 flex-1 flex-col items-center">
                <div className="relative z-10 flex h-8 w-full items-center justify-center">
                  <div
                    className={cn(
                      'flex items-center justify-center rounded-full bg-white',
                      visual.circle,
                    )}
                  >
                    {visual.content ?? (
                      <span className="text-[10px] font-semibold">{stepNumber}</span>
                    )}
                  </div>
                </div>
                <div className={cn('mt-1 text-center text-[9px] font-medium', visual.label)}>
                  {STEPPER_STAGE_LABELS[stage as LifecycleStage]}
                </div>
                <div className="text-center text-[9px] text-stone-500">
                  {stageStatusLabel(status)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <div className="h-px flex-1 bg-stone-200" />
        <div className="flex items-center gap-1.5 rounded-md border-[0.5px] border-stone-200 bg-stone-100 px-2.5 py-1 text-[10px] text-stone-600">
          <Star className="h-3 w-3 text-[#BA7517]" />
          Enablement (cross-cutting) — active throughout all stages
        </div>
        <div className="h-px flex-1 bg-stone-200" />
      </div>
    </div>
  )
}
