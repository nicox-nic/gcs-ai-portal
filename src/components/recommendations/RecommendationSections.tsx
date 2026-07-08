import { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  ExternalLink,
  Layers,
  Plus,
  ShieldCheck,
  Sparkles,
  Terminal,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ToolStackChips } from '@/components/common/ToolStackChips'
import { Button } from '@/components/ui/button'
import { recommendCombos } from '@/lib/recommendationEngine'
import {
  addToStack,
  getStackRole,
  isToolInStack,
  promoteToPrimary,
  removeFromStack,
} from '@/lib/toolStack'
import { cn } from '@/lib/utils'
import type { Recommendation, Submission, Tool, ToolCombo, ToolStackEntry, Training } from '@/types'

const COMBO_SUB_LABELS = ['Best fit', 'Lower complexity', 'Alternative approach']

function confidencePercent(confidence: number): number {
  return Math.round(confidence * 100)
}

export function getDisplayedCombos(
  submission: Submission,
  combos: ToolCombo[],
  recommendedComboIds: string[],
  tools: Tool[],
): ToolCombo[] {
  const ranked = recommendCombos(submission, combos, tools).filter(
    (combo) => combo.matchScore >= 30,
  )
  const fromIds = recommendedComboIds
    .map((id) => ranked.find((combo) => combo.id === id))
    .filter((combo): combo is ToolCombo => Boolean(combo))
  if (fromIds.length >= 3) return fromIds.slice(0, 3)
  const merged = [...fromIds]
  for (const combo of ranked) {
    if (!merged.some((item) => item.id === combo.id)) merged.push(combo)
    if (merged.length >= 3) break
  }
  return merged.slice(0, 3)
}

type ComboCardProps = {
  combo: ToolCombo
  tools: Tool[]
  index: number
  selected: boolean
  onSelect: () => void
}

export function ComboCard({ combo, tools, index, selected, onSelect }: ComboCardProps) {
  const primaryTool = tools.find((tool) => tool.id === combo.primaryToolId)
  const addOnTools = combo.addOnToolIds
    .map((id) => tools.find((tool) => tool.id === id))
    .filter((tool): tool is Tool => Boolean(tool))

  return (
    <div
      className={cn(
        'relative rounded-lg bg-white p-4',
        selected
          ? 'border-2 border-indigo-600 shadow-[0_2px_8px_rgba(83,74,183,0.10)]'
          : 'border-[0.5px] border-stone-200',
      )}
    >
      {selected && (
        <div className="absolute -top-px left-3 flex items-center gap-1 rounded-b-md bg-indigo-600 px-2.5 py-0.5 text-[10px] font-semibold text-white">
          <CircleCheck className="h-3 w-3" />
          Selected Stack
        </div>
      )}

      <div className={cn('mb-2', selected && 'mt-3')}>
        <div className="text-xs font-semibold text-stone-900">{combo.name}</div>
        <div className="text-[10px] text-stone-500">
          {COMBO_SUB_LABELS[index] ?? 'Recommended'} · {combo.matchScore}% match
        </div>
      </div>

      <div className="mb-2.5 space-y-1.5">
        {primaryTool && (
          <div className="flex items-center gap-2 rounded-md bg-[#EEEDFE] px-2.5 py-1.5">
            <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
              PRIMARY
            </span>
            <span className="text-[11px] font-medium text-[#26215C]">{primaryTool.name}</span>
          </div>
        )}
        {addOnTools.map((tool) => (
          <div
            key={tool.id}
            className="flex items-center gap-2 rounded-md bg-stone-100 px-2.5 py-1.5"
          >
            <span className="rounded bg-stone-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
              + ADD-ON
            </span>
            <span className="flex-1 text-[11px] text-stone-900">{tool.name}</span>
            {combo.addOnRoles[tool.id] && (
              <span className="text-[10px] text-stone-500">{combo.addOnRoles[tool.id]}</span>
            )}
          </div>
        ))}
      </div>

      <p className="mb-2.5 text-[11px] leading-relaxed text-stone-600">{combo.description}</p>

      {combo.riskFlags.length > 0 && (
        <div className="mb-2.5 flex items-start gap-1.5 rounded-md border-[0.5px] border-orange-200 bg-[#FEF3EC] px-2 py-1.5 text-[10px] text-orange-800">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          {combo.riskFlags[0]}
        </div>
      )}

      <Button
        type="button"
        className={cn(
          'h-8 w-full justify-center text-xs',
          selected
            ? 'bg-indigo-600 text-white hover:bg-indigo-600'
            : 'border-[0.5px] border-stone-200 bg-white text-stone-900 hover:bg-stone-50',
        )}
        disabled={selected}
        onClick={onSelect}
      >
        {selected ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Stack selected
          </>
        ) : (
          'Select this stack'
        )}
      </Button>
    </div>
  )
}

type ToolRankingCardProps = {
  recommendation: Recommendation
  tool: Tool
  trainings: Training[]
  stack: ToolStackEntry[]
  onStackChange: (stack: ToolStackEntry[]) => void
}

export function ToolRankingCard({
  recommendation,
  tool,
  trainings,
  stack,
  onStackChange,
}: ToolRankingCardProps) {
  const pct = confidencePercent(recommendation.confidence)
  const role = getStackRole(stack, tool.id)
  const isPrimary = role === 'primary'
  const isAddOn = role === 'supporting'
  const linkedTrainings = trainings.filter((training) => training.toolIds.includes(tool.id))

  const handleAdd = () => {
    if (recommendation.rank === 1) {
      onStackChange(promoteToPrimary(stack, tool.id))
      return
    }
    onStackChange(addToStack(stack, tool.id))
    toast.success(`${tool.name} added to stack.`)
  }

  const handleRemove = () => {
    onStackChange(removeFromStack(stack, tool.id))
    toast.success(`${tool.name} removed from stack.`)
  }

  return (
    <div
      className={cn(
        'rounded-lg bg-white p-4',
        isPrimary && 'border-2 border-indigo-600 shadow-[0_2px_8px_rgba(83,74,183,0.10)]',
        isAddOn && 'border-[1.5px] border-[#1D9E75]',
        !isPrimary && !isAddOn && 'border-[0.5px] border-stone-200',
      )}
    >
      <div
        className={cn(
          'mb-2 inline-flex rounded px-2 py-0.5 text-[10px] font-semibold text-white',
          isPrimary && 'bg-indigo-600',
          isAddOn && 'bg-[#1D9E75]',
          !isPrimary && !isAddOn && 'bg-stone-400',
        )}
      >
        {isPrimary ? '#1 Primary' : isAddOn ? `#${recommendation.rank} Add-on ✓` : `#${recommendation.rank}`}
      </div>

      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="text-[13px] font-semibold text-stone-900">{tool.name}</div>
          <div className="text-[10px] text-stone-500">
            {tool.category} · {tool.vendor}
          </div>
        </div>
        <span
          className={cn(
            'rounded px-2 py-0.5 text-[11px] font-semibold',
            isPrimary && 'bg-indigo-50 text-indigo-900',
            isAddOn && 'bg-green-50 text-green-900',
            !isPrimary && !isAddOn && 'bg-stone-100 text-stone-600',
          )}
        >
          {pct}%
        </span>
      </div>

      <div className="mb-0.5 flex justify-between text-[10px] text-stone-500">
        <span>Confidence</span>
        <span
          className={cn(
            'font-medium',
            isPrimary && 'text-indigo-900',
            isAddOn && 'text-green-900',
            !isPrimary && !isAddOn && 'text-stone-600',
          )}
        >
          {pct}%
        </span>
      </div>
      <div
        className={cn(
          'mb-2 h-1 overflow-hidden rounded-full',
          isPrimary && 'bg-indigo-50',
          isAddOn && 'bg-[#D5EBE0]',
          !isPrimary && !isAddOn && 'bg-stone-100',
        )}
      >
        <div
          className={cn(
            'h-full rounded-full',
            isPrimary && 'bg-indigo-600',
            isAddOn && 'bg-[#1D9E75]',
            !isPrimary && !isAddOn && 'bg-stone-400',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mb-2 text-[11px] leading-relaxed text-stone-600">{recommendation.rationale}</p>

      <div className="mb-1 flex items-center gap-1 text-[10px] font-medium text-stone-900">
        <Terminal className="h-3 w-3 text-stone-500" />
        Rules fired
      </div>
      <div className="mb-2 space-y-0.5 text-[10px] text-stone-600">
        {recommendation.rulesFired.slice(0, 4).map((rule) => (
          <div key={rule} className="flex gap-1">
            <span className={rule.includes('−') ? 'text-red-600' : 'text-green-700'}>
              {rule.includes('−') ? '–' : '✓'}
            </span>
            <span>{rule}</span>
          </div>
        ))}
      </div>

      {linkedTrainings.length > 0 && (
        <>
          <div className="mb-1 flex items-center gap-1 text-[10px] font-medium text-stone-900">
            <Sparkles className="h-3 w-3 text-stone-500" />
            Linked Trainings
          </div>
          <div className="mb-3">
            {linkedTrainings.slice(0, 1).map((training) => (
              <a
                key={training.id}
                href={training.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border-[0.5px] border-stone-200 bg-stone-50 px-2 py-1 text-[10px] text-stone-700 hover:bg-stone-100"
              >
                {training.title}
                <ExternalLink className="h-3 w-3 text-indigo-600" />
              </a>
            ))}
          </div>
        </>
      )}

      {isPrimary ? (
        <div className="flex items-center gap-1.5 rounded-md border-[0.5px] border-[#A8DFC8] bg-[#F0FBF6] px-2.5 py-1.5 text-[11px] text-[#0F6E56]">
          <CircleCheck className="h-3.5 w-3.5" />
          Set as primary tool
        </div>
      ) : isAddOn ? (
        <div className="flex items-center justify-between rounded-md border-[0.5px] border-[#A8DFC8] bg-[#F0FBF6] px-2.5 py-1.5">
          <span className="text-[11px] font-medium text-[#0F6E56]">Added to stack</span>
          <button
            type="button"
            className="text-[10px] text-red-600 hover:underline"
            onClick={handleRemove}
          >
            Remove
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-8 w-full justify-center text-[11px]"
          onClick={handleAdd}
        >
          <Plus className="h-3.5 w-3.5" />
          Add to stack
        </Button>
      )}
    </div>
  )
}

type AlternativeToolCardProps = {
  recommendation: Recommendation
  tool: Tool
  stack: ToolStackEntry[]
  onStackChange: (stack: ToolStackEntry[]) => void
}

export function AlternativeToolCard({
  recommendation,
  tool,
  stack,
  onStackChange,
}: AlternativeToolCardProps) {
  const pct = confidencePercent(recommendation.confidence)
  const inStack = isToolInStack(stack, tool.id)

  return (
    <div className="flex gap-2.5 rounded-lg border-[0.5px] border-stone-200 bg-white p-3">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-stone-900">{tool.name}</div>
            <div className="text-[10px] text-stone-500">
              {tool.category} · {tool.vendor}
            </div>
          </div>
          <span className="text-[10px] font-medium text-stone-500">{pct}%</span>
        </div>
        <div className="mb-1.5 h-0.5 overflow-hidden rounded-full bg-stone-200">
          <div className="h-full bg-stone-400" style={{ width: `${pct}%` }} />
        </div>
        <p className="mb-2 text-[10px] leading-relaxed text-stone-600">{recommendation.rationale}</p>
        {!inStack ? (
          <Button
            type="button"
            variant="outline"
            className="h-7 px-3 text-[10px]"
            onClick={() => {
              onStackChange(addToStack(stack, tool.id))
              toast.success(`${tool.name} added to stack.`)
            }}
          >
            <Plus className="h-3 w-3" />
            Add to stack
          </Button>
        ) : (
          <span className="text-[10px] font-medium text-green-800">Added to stack</span>
        )}
      </div>
    </div>
  )
}

type SubmissionSummaryBarProps = {
  submission: Submission
}

export function SubmissionSummaryBar({ submission }: SubmissionSummaryBarProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mb-4 rounded-lg border-[0.5px] border-stone-200 bg-white px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-6 text-[11px]">
          <div>
            <span className="text-stone-500">Use case: </span>
            <span className="font-medium text-stone-900">{submission.useCase}</span>
          </div>
          <div>
            <span className="text-stone-500">Sensitivity: </span>
            <span className="font-medium text-stone-900">{submission.dataSensitivity}</span>
          </div>
          <div>
            <span className="text-stone-500">Skill: </span>
            <span className="font-medium text-stone-900">{submission.skillLevelAvailable}</span>
          </div>
          <div>
            <span className="text-stone-500">Est. benefit: </span>
            <span className="font-medium text-stone-900">
              ~{submission.expectedBenefitHours} hrs/month
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="h-8 shrink-0 text-xs"
          onClick={() => setExpanded((value) => !value)}
        >
          View full submission
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
      </div>
      {expanded && (
        <div className="mt-3 grid gap-2 border-t-[0.5px] border-stone-200 pt-3 text-[11px] text-stone-700">
          <p>
            <span className="font-medium text-stone-900">Problem: </span>
            {submission.problem}
          </p>
          <p>
            <span className="font-medium text-stone-900">Goal: </span>
            {submission.goal}
          </p>
          <p>
            <span className="font-medium text-stone-900">Expected outcome: </span>
            {submission.expectedOutcome}
          </p>
          <p>
            <span className="font-medium text-stone-900">Data sources: </span>
            {submission.dataSources}
          </p>
          <p>
            <span className="font-medium text-stone-900">Integrations: </span>
            {submission.integrationTargets.join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}

type SelectedStackBarProps = {
  stack: ToolStackEntry[]
  tools: Tool[]
  onCustomise: () => void
}

export function SelectedStackBar({ stack, tools, onCustomise }: SelectedStackBarProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-lg border-[1.5px] border-indigo-200 bg-[#EEEDFE] px-4 py-3.5 lg:flex-row lg:items-center">
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[#26215C]">
          <Layers className="h-3.5 w-3.5" />
          Your selected tool stack
        </div>
        <ToolStackChips toolStack={stack} tools={tools} />
      </div>
      <p className="text-[11px] text-[#3C3489] lg:max-w-[220px]">
        You can update your stack any time from the project detail page.
      </p>
      <Button
        type="button"
        variant="outline"
        className="h-8 shrink-0 border-[#CECBF6] text-xs text-[#3C3489] hover:bg-white/60"
        onClick={onCustomise}
      >
        Customise stack
      </Button>
    </div>
  )
}

export function RecommendationFooter({ projectId }: { projectId: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border-[0.5px] border-stone-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-1.5 text-[11px] text-stone-600">
        <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
        Your stack is saved automatically. You can update it any time from the project detail page.
      </div>
      <Button asChild className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700">
        <Link to={`/projects/${projectId}`}>
          Continue to Project
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  )
}
