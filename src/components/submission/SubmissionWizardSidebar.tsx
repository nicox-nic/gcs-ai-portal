import { Circle, CircleCheck, Info, Lightbulb, ListChecks } from 'lucide-react'
import type { ChecklistItem } from '@/lib/submissionWizard'
import { cn } from '@/lib/utils'

const TIPS = [
  "Be specific about the problem you're solving, not just the solution you want.",
  'Mention the data you have access to and its format (Excel, SharePoint, SQL, etc.).',
  'Include any tools your team already uses — it helps match you to the right stack.',
  'Estimate hours saved per month — even a rough guess helps justify the project.',
]

const AFTER_SUBMIT_STEPS = [
  "You'll see your top 3 tool recommendations instantly.",
  'Your project goes to the Governance Lead for qualification review.',
  "You'll be notified when it's approved to proceed to development.",
]

type SubmissionWizardSidebarProps = {
  checklist: ChecklistItem[]
}

export function SubmissionWizardSidebar({ checklist }: SubmissionWizardSidebarProps) {
  return (
    <div className="flex w-full flex-col gap-3 lg:w-[320px] lg:shrink-0">
      <div className="rounded-lg border-[0.5px] border-stone-200 bg-white p-4">
        <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium text-stone-900">
          <ListChecks className="h-3.5 w-3.5 text-indigo-600" />
          Progress Checklist
        </div>
        <div className="space-y-2">
          {checklist.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-[11px]">
              {item.complete ? (
                <CircleCheck className="h-3.5 w-3.5 shrink-0 text-[#1D9E75]" />
              ) : (
                <Circle className="h-3.5 w-3.5 shrink-0 text-stone-400" />
              )}
              <span className={cn(item.complete ? 'text-stone-900' : 'text-stone-500')}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border-[0.5px] border-stone-200 bg-white p-4">
        <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium text-stone-900">
          <Lightbulb className="h-3.5 w-3.5 text-[#BA7517]" />
          Tips for a better recommendation
        </div>
        <div className="space-y-1.5 text-[11px] leading-relaxed text-stone-600">
          {TIPS.map((tip) => (
            <div key={tip} className="flex gap-1.5">
              <span className="shrink-0 text-indigo-600">→</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border-[0.5px] border-[#CECBF6] bg-[#EEEDFE] p-3.5">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-[#26215C]">
          <Info className="h-3.5 w-3.5" />
          What happens after you submit?
        </div>
        <div className="space-y-1.5 text-[11px] leading-relaxed text-[#3C3489]">
          {AFTER_SUBMIT_STEPS.map((step, index) => (
            <div key={step} className="flex items-start gap-1.5">
              <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-semibold text-white">
                {index + 1}
              </span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
