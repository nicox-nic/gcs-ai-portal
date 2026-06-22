import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WIZARD_STEPS } from '@/lib/submissionWizard'

type WizardStepperProps = {
  currentStep: number
}

const STEP_COUNT = WIZARD_STEPS.length
const TRACK_INSET_PERCENT = (0.5 / STEP_COUNT) * 100

function wizardProgressPercent(currentStep: number): number {
  if (currentStep <= 1) return 0
  if (currentStep >= STEP_COUNT) return 100

  const progressCenterIndex = currentStep - 1
  const trackStart = TRACK_INSET_PERCENT
  const trackEnd = 100 - TRACK_INSET_PERCENT
  const trackLength = trackEnd - trackStart
  const progressEnd = ((progressCenterIndex + 0.5) / STEP_COUNT) * 100

  return Math.min(100, Math.max(0, ((progressEnd - trackStart) / trackLength) * 100))
}

export function WizardStepper({ currentStep }: WizardStepperProps) {
  const progress = wizardProgressPercent(currentStep)

  return (
    <div className="rounded-lg border-[0.5px] border-stone-200 bg-white px-5 py-4">
      <div className="relative">
        <div
          className="pointer-events-none absolute top-4 h-[2px] -translate-y-1/2 bg-[#E2E0D8]"
          style={{
            left: `${TRACK_INSET_PERCENT}%`,
            right: `${TRACK_INSET_PERCENT}%`,
          }}
          aria-hidden
        />

        {progress > 0 && (
          <div
            className="pointer-events-none absolute top-4 h-[2px] -translate-y-1/2 bg-indigo-600"
            style={{
              left: `${TRACK_INSET_PERCENT}%`,
              width: `${((100 - TRACK_INSET_PERCENT * 2) * progress) / 100}%`,
            }}
            aria-hidden
          />
        )}

        <div className="relative grid grid-cols-4 gap-2">
          {WIZARD_STEPS.map((step, index) => {
            const stepNumber = index + 1
            const isDone = stepNumber < currentStep
            const isActive = stepNumber === currentStep

            return (
              <div key={step.label} className="flex min-w-0 flex-col items-center">
                <div className="relative z-10 flex h-8 w-full items-center justify-center">
                  <div
                    className={cn(
                      'flex items-center justify-center rounded-full bg-white text-[11px] font-semibold transition-all',
                      isDone && 'h-7 w-7 bg-indigo-600 text-white',
                      isActive &&
                        'h-8 w-8 border-2 border-indigo-600 bg-indigo-50 text-indigo-900 shadow-[0_0_0_4px_rgba(83,74,183,0.12)]',
                      !isDone &&
                        !isActive &&
                        'h-7 w-7 border-[1.5px] border-stone-300 bg-stone-100 text-stone-500',
                    )}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" /> : stepNumber}
                  </div>
                </div>
                <div
                  className={cn(
                    'mt-1 text-[9px] font-medium',
                    isDone || isActive ? 'text-indigo-900' : 'text-stone-500',
                  )}
                >
                  {step.label}
                </div>
                <div className="text-[9px] text-stone-500">{step.sub}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
