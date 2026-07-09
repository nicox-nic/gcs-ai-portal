import { useEffect, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Info,
  Layers,
  Play,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { RoleBadge } from '@/components/common/RoleBadge'
import { StatusBadge } from '@/components/common/StatusBadge'
import { TierBadge } from '@/components/common/TierBadge'
import {
  AlternativeToolCard,
  ComboCard,
  getDisplayedCombos,
  ToolRankingCard,
} from '@/components/recommendations/RecommendationSections'
import { RequirementsPanel, UatPanel } from '@/components/project/BaDeliveryPanels'
import { StatusGateActions } from '@/components/project/StatusGateActions'
import { ToolStackChips } from '@/components/common/ToolStackChips'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ROLE_STYLES, getUserInitials } from '@/lib/roleStyles'
import {
  canCompleteDeployment,
  canCompleteDevelopment,
  deploymentGateBlockReason,
  developmentGateBlockReason,
} from '@/lib/baArtifacts'
import {
  LIFECYCLE_STAGES,
  canActOnStage,
  getAllowedTransitions,
  getStageMeta,
  type StageTransitionOption,
} from '@/lib/lifecycle'
import { recommendCombos, recommendTools } from '@/lib/recommendationEngine'
import {
  formatAuditAction,
  getUserById,
  getUserDisplayName,
  recentAuditEntries,
  shortActorName,
} from '@/lib/projectDisplay'
import {
  TIER_META,
  canOwnStack,
  getStackOwnerRoles,
  isProjectReviewEntry,
} from '@/lib/tiering'
import { comboMatchesStack } from '@/lib/toolStack'
import { cn, formatDateTime, formatRelative, humanizeRole, humanizeStage } from '@/lib/utils'
import { useCatalogStore } from '@/stores/catalogStore'
import { useProjectsStore } from '@/stores/projectsStore'
import type { Project, Tool, ToolCombo, Training, User } from '@/types'

type ProjectTabsProps = {
  project: Project
  tools: Tool[]
  combos: ToolCombo[]
  trainings: Training[]
  currentUser: User | null
  activeTab: string
  onTabChange: (tab: string) => void
  onCustomiseStack: () => void
  onRequestTransition: (transition: StageTransitionOption) => void
  onReportBenefits: (hours: number) => void
  onValidateBenefits?: () => void
  onApplyCombo: (comboId: string) => void
}

function CollapsibleSection({
  title,
  defaultOpen = true,
  collapsedHint,
  children,
}: {
  title: string
  defaultOpen?: boolean
  collapsedHint?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mb-3.5">
      <button
        type="button"
        className="mb-2 flex w-full items-center gap-1.5 text-[11px] font-semibold text-stone-900"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-indigo-600" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
        )}
        {title}
        {!open && collapsedHint && (
          <span className="ml-1 text-[10px] font-normal text-stone-500">{collapsedHint}</span>
        )}
      </button>
      {open && children}
    </div>
  )
}

function TransitionButtons({
  project,
  currentUser,
  stage,
  onRequestTransition,
}: {
  project: Project
  currentUser: User | null
  stage: Project['currentStage']
  onRequestTransition: (transition: StageTransitionOption) => void
}) {
  const status = project.stageStatus[stage]
  const transitions =
    stage === project.currentStage ? getAllowedTransitions(stage, status) : []
  const canAct = currentUser ? canActOnStage(currentUser.role, stage) : false
  const meta = getStageMeta(stage)

  if (transitions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {transitions.map((transition) => {
        const isComplete = transition.toStatus === 'Completed'
        let baGateBlocked = false
        let baGateReason: string | null = null
        if (isComplete && stage === 'Development') {
          baGateBlocked = !currentUser || !canCompleteDevelopment(project, currentUser)
          baGateReason = developmentGateBlockReason(project) ??
            (!currentUser ? 'Sign in to complete this stage.' : null)
        } else if (isComplete && stage === 'Deployment') {
          baGateBlocked = !currentUser || !canCompleteDeployment(project, currentUser)
          baGateReason = deploymentGateBlockReason(project) ??
            (!currentUser ? 'Sign in to complete this stage.' : null)
        }

        const enabled = canAct && !baGateBlocked
        const tooltipText = !canAct
          ? `Only ${humanizeRole(meta.primaryOwnerRole)} or supporting roles can act on this stage.`
          : baGateBlocked
            ? baGateReason ?? 'BA gate not met.'
            : null

        const button = (
          <Button
            key={`${transition.toStage}-${transition.toStatus}`}
            type="button"
            variant="outline"
            className={cn('h-8 flex-1 text-xs', !enabled && 'cursor-not-allowed opacity-50')}
            disabled={!enabled}
            onClick={() => enabled && onRequestTransition(transition)}
          >
            {transition.label}
          </Button>
        )

        if (!tooltipText) return button

        return (
          <Tooltip key={`${transition.toStage}-${transition.toStatus}`}>
            <TooltipTrigger asChild>
              <span className="flex-1">{button}</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">{tooltipText}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

export function ProjectOverviewTab({
  project,
  tools,
  trainings,
  currentUser,
  onTabChange,
  onRequestTransition,
}: Pick<
  ProjectTabsProps,
  'project' | 'tools' | 'trainings' | 'currentUser' | 'onTabChange' | 'onRequestTransition'
>) {
  const stageMeta = getStageMeta(project.currentStage)
  const currentStatus = project.stageStatus[project.currentStage]
  const canAct = currentUser ? canActOnStage(currentUser.role, project.currentStage) : false
  const activity = recentAuditEntries(project, 4)
  const logProjectReview = useProjectsStore((s) => s.logProjectReview)
  const [reviewNote, setReviewNote] = useState('')

  const stackTrainings = trainings.filter((training) =>
    training.toolIds.some((toolId) => project.toolStack.some((entry) => entry.toolId === toolId)),
  )

  const showTierCard =
    project.tier !== null &&
    (project.status === 'Active' ||
      project.status === 'ForSponsorApproval' ||
      project.status === 'Disapproved' ||
      project.status === 'Completed' ||
      project.status === 'Idle')

  const tierMeta = project.tier ? TIER_META[project.tier] : null
  const ownerRoles = getStackOwnerRoles(project.tier)
  const canLogReview =
    currentUser !== null &&
    project.status === 'Active' &&
    (project.tier === 'Tier2' || project.tier === 'Tier3') &&
    (currentUser.role === 'AIProgramManager' ||
      currentUser.role === 'GovernanceLead' ||
      currentUser.role === 'Admin')

  const reviewEntries = project.auditLog
    .filter((entry) => isProjectReviewEntry(entry.note))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">
      <div className="border-b-[0.5px] border-stone-200 p-4 lg:border-r lg:border-b-0">
        <CollapsibleSection title="Basics">
          <div className="grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">
            <div>
              <span className="text-stone-500">Group: </span>
              {project.group}
            </div>
            <div>
              <span className="text-stone-500">Site: </span>
              {project.site}
            </div>
            <div>
              <span className="text-stone-500">Department: </span>
              {project.department}
            </div>
            <div>
              <span className="text-stone-500">Target users: </span>
              {project.submission.targetUsers}
            </div>
            <div>
              <span className="text-stone-500">Est. users: </span>
              {project.submission.estimatedUsers}
            </div>
            <div>
              <span className="text-stone-500">Est. benefit: </span>
              {project.submission.expectedBenefitHours} hrs/month
            </div>
          </div>
        </CollapsibleSection>

        <hr className="mb-3.5 border-stone-200" />

        <CollapsibleSection title="Use Case">
          <div className="space-y-2 text-[11px] leading-relaxed text-stone-600">
            <p>
              <span className="text-stone-500">Problem: </span>
              {project.submission.problem}
            </p>
            <p>
              <span className="text-stone-500">Goal: </span>
              {project.submission.goal}
            </p>
            <p>
              <span className="text-stone-500">Expected outcome: </span>
              {project.submission.expectedOutcome}
            </p>
          </div>
        </CollapsibleSection>

        <hr className="mb-3.5 border-stone-200" />

        <CollapsibleSection
          title="Data & Technical Readiness"
          defaultOpen={false}
          collapsedHint="(collapsed)"
        >
          <div className="space-y-2 text-[11px] text-stone-600">
            <p>
              <span className="text-stone-500">Data sources: </span>
              {project.submission.dataSources}
            </p>
            <p>
              <span className="text-stone-500">Sensitivity: </span>
              {project.submission.dataSensitivity}
            </p>
            <p>
              <span className="text-stone-500">Access: </span>
              {project.submission.dataAccessStatus}
            </p>
            <p>
              <span className="text-stone-500">Skill level: </span>
              {project.submission.skillLevelAvailable}
            </p>
            <p>
              <span className="text-stone-500">Existing tools: </span>
              {project.submission.existingTools.join(', ')}
            </p>
            <p>
              <span className="text-stone-500">Integrations: </span>
              {project.submission.integrationTargets.join(', ')}
            </p>
          </div>
        </CollapsibleSection>

        {showTierCard && tierMeta && project.tier && (
          <div className="mb-3.5 border-t-[0.5px] border-stone-200 pt-3.5">
            <div className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold text-stone-900">
              <Layers className="h-3.5 w-3.5 text-indigo-700" />
              Tier & Development
            </div>
            <div className="rounded-md border-[0.5px] border-stone-200 bg-stone-50 p-3 text-[11px]">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <TierBadge tier={project.tier} />
                <span className="text-stone-500">Risk: {tierMeta.risk}</span>
              </div>
              <p className="mb-2 text-stone-700">{tierMeta.approach}</p>
              <p className="mb-2 text-stone-600">{tierMeta.guidance}</p>
              <div className="mb-2">
                <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-stone-500">
                  Who develops
                </span>
                <div className="flex flex-wrap gap-1">
                  {ownerRoles.map((role) => (
                    <RoleBadge key={role} role={role} />
                  ))}
                </div>
              </div>
              {reviewEntries.length > 0 && (
                <div className="mb-2 space-y-1.5 border-t-[0.5px] border-stone-200 pt-2">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
                    Project reviews
                  </span>
                  {reviewEntries.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="rounded bg-white px-2 py-1.5 text-[10px] text-stone-600">
                      <p>{entry.note.replace(/^\[Project Review\]\s*/, '')}</p>
                      <p className="text-stone-400">
                        {formatRelative(entry.timestamp)} · {humanizeRole(entry.actorRole)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {canLogReview && (
                <div className="border-t-[0.5px] border-stone-200 pt-2">
                  <label className="mb-1 block text-[10px] font-medium text-stone-600">
                    Log project review
                  </label>
                  <Textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    className="mb-2 min-h-[60px] text-xs"
                    placeholder="Checkpoint notes…"
                  />
                  <Button
                    type="button"
                    className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700"
                    onClick={() => {
                      if (!currentUser) return
                      try {
                        logProjectReview(project.id, reviewNote, currentUser)
                        toast.success('Project review logged.')
                        setReviewNote('')
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : 'Could not log review.',
                        )
                      }
                    }}
                  >
                    Log project review
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border-t-[0.5px] border-stone-200 pt-3.5">
          <div className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold text-stone-900">
            <Play className="h-3.5 w-3.5 text-amber-700" />
            Current Stage Actions — {humanizeStage(project.currentStage)}
            {currentStatus === 'InProgress' && (
              <StatusBadge kind="stage" status="InProgress" className="ml-1" />
            )}
          </div>

          <div className="mb-2.5 rounded-md bg-stone-100 p-3 text-[11px]">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-medium text-stone-900">Primary owner</span>
              <RoleBadge role={stageMeta.primaryOwnerRole} />
            </div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-stone-900">Supporting roles</span>
              <div className="flex flex-wrap gap-1">
                {stageMeta.supportingRoles.map((role) => (
                  <RoleBadge key={role} role={role} />
                ))}
              </div>
            </div>
            {!canAct && currentUser && (
              <div className="flex items-start gap-1.5 rounded-md border-[0.5px] border-[#CECBF6] bg-[#EEEDFE] px-2.5 py-2 text-[11px] text-[#26215C]">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                You are viewing as {humanizeRole(currentUser.role)}. Only{' '}
                {humanizeRole(stageMeta.primaryOwnerRole)} and supporting roles can advance this
                stage.
              </div>
            )}
          </div>

          {project.currentStage === 'Development' && (
            <RequirementsPanel project={project} currentUser={currentUser} />
          )}
          {project.currentStage === 'Deployment' && (
            <UatPanel project={project} currentUser={currentUser} />
          )}

          <TransitionButtons
            project={project}
            currentUser={currentUser}
            stage={project.currentStage}
            onRequestTransition={onRequestTransition}
          />
        </div>

        <StatusGateActions project={project} currentUser={currentUser} />
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-900">Recent Activity</span>
            <button
              type="button"
              className="text-[10px] text-indigo-700 hover:underline"
              onClick={() => onTabChange('audit')}
            >
              View all →
            </button>
          </div>
          <div className="space-y-2">
            {activity.map((entry) => {
              const actor = getUserById(entry.actorUserId)
              const initials = actor ? getUserInitials(actor.displayName) : '??'
              return (
                <div key={entry.id} className="flex gap-2 text-[11px]">
                  <div
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold',
                      actor ? ROLE_STYLES[actor.role].avatar : 'bg-stone-100 text-stone-600',
                    )}
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="text-stone-900">
                      <strong>{actor ? shortActorName(actor.displayName) : 'Unknown'}</strong>{' '}
                      {formatAuditAction(entry, project.title)}
                    </p>
                    <p className="text-[10px] text-stone-500">
                      {formatRelative(entry.timestamp)} · {humanizeRole(entry.actorRole)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <hr className="border-stone-200" />

        <div>
          <div className="mb-2 text-[11px] font-semibold text-stone-900">Tool Stack</div>
          <div className="space-y-1.5">
            {project.toolStack.map((entry) => {
              const tool = tools.find((item) => item.id === entry.toolId)
              if (!tool) return null
              const isPrimary = entry.role === 'primary'
              return (
                <div
                  key={entry.toolId}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2.5 py-1.5',
                    isPrimary ? 'bg-indigo-50' : 'bg-green-50',
                  )}
                >
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[9px] font-bold text-white',
                      isPrimary ? 'bg-indigo-600' : 'bg-[#1D9E75]',
                    )}
                  >
                    {isPrimary ? 'PRIMARY' : 'ADD-ON'}
                  </span>
                  <span className="text-[11px] font-medium text-stone-900">{tool.name}</span>
                  {entry.usageNote && (
                    <span className="ml-auto text-[10px] text-stone-500">{entry.usageNote}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <hr className="border-stone-200" />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-900">Recommended Trainings</span>
            <Link to="/trainings" className="text-[10px] text-indigo-700 hover:underline">
              View catalog →
            </Link>
          </div>
          <div className="space-y-1.5">
            {stackTrainings.slice(0, 3).map((training) => (
              <a
                key={training.id}
                href={training.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-md bg-stone-100 px-2.5 py-2 text-[11px] hover:bg-stone-200/70"
              >
                <div>
                  <div className="font-medium text-stone-900">{training.title}</div>
                  <div className="text-[10px] text-stone-500">
                    {training.format} · {training.durationHours}h
                  </div>
                </div>
                <ExternalLink className="h-3 w-3 text-indigo-600" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProjectLifecycleTab({
  project,
  currentUser,
  onRequestTransition,
}: Pick<ProjectTabsProps, 'project' | 'currentUser' | 'onRequestTransition'>) {
  return (
    <div className="space-y-3 p-4">
      {LIFECYCLE_STAGES.map((meta) => {
        const status = project.stageStatus[meta.stage]
        const isCurrent = project.currentStage === meta.stage
        return (
          <div
            key={meta.stage}
            className={cn(
              'rounded-lg border-[0.5px] border-stone-200 bg-white p-4',
              isCurrent && 'border-indigo-200 bg-indigo-50/30',
            )}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-medium text-stone-900">{meta.label}</h3>
              <StatusBadge kind="stage" status={status} />
              {isCurrent && (
                <span className="text-[10px] font-medium text-indigo-700">Current stage</span>
              )}
            </div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-stone-500">Primary owner:</span>
              <RoleBadge role={meta.primaryOwnerRole} />
              <span className="text-stone-500">Supporting:</span>
              {meta.supportingRoles.map((role) => (
                <RoleBadge key={role} role={role} />
              ))}
            </div>
            {isCurrent && meta.stage === 'Development' && (
              <RequirementsPanel project={project} currentUser={currentUser} />
            )}
            {isCurrent && meta.stage === 'Deployment' && (
              <UatPanel project={project} currentUser={currentUser} />
            )}
            {isCurrent && (
              <TransitionButtons
                project={project}
                currentUser={currentUser}
                stage={meta.stage}
                onRequestTransition={onRequestTransition}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function ProjectToolSelectionTab({
  project,
  tools,
  combos,
  trainings,
  currentUser,
  onCustomiseStack,
  onApplyCombo,
}: Pick<
  ProjectTabsProps,
  | 'project'
  | 'tools'
  | 'combos'
  | 'trainings'
  | 'currentUser'
  | 'onCustomiseStack'
  | 'onApplyCombo'
>) {
  const setRecommendations = useProjectsStore((s) => s.setRecommendations)
  const updateToolStack = useProjectsStore((s) => s.updateToolStack)
  const submitForReview = useProjectsStore((s) => s.submitForReview)
  const saveQualifiedDraft = useProjectsStore((s) => s.saveQualifiedDraft)
  const catalogTrainings = useCatalogStore((s) => s.trainings)
  const resolvedTrainings = trainings.length > 0 ? trainings : catalogTrainings

  const editable =
    project.status === 'Qualified' || project.status === 'QualifiedDraft'
  const canEdit = editable && canOwnStack(project, currentUser)

  const generateRecommendations = (force: boolean) => {
    if (!force && project.recommendations.length > 0) return
    const { top, alternatives } = recommendTools(
      project.submission,
      tools,
      resolvedTrainings,
    )
    const rankedCombos = recommendCombos(project.submission, combos, tools)
    const recommendedComboIds = rankedCombos
      .filter((combo) => combo.matchScore >= 30)
      .slice(0, 3)
      .map((combo) => combo.id)
    setRecommendations(project.id, top, alternatives, recommendedComboIds)
  }

  useEffect(() => {
    if (!editable) return
    if (project.recommendations.length > 0) return
    generateRecommendations(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- generate once when empty post-qualification
  }, [editable, project.id, project.recommendations.length])

  const displayedCombos = getDisplayedCombos(
    project.submission,
    combos,
    project.recommendedComboIds,
    tools,
  )

  const handleStackChange = (stack: Project['toolStack']) => {
    if (!canEdit) return
    try {
      updateToolStack(project.id, stack)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update stack.')
    }
  }

  const handleSubmitForReview = () => {
    if (!currentUser) return
    try {
      submitForReview(project.id, currentUser)
      toast.success('Submitted for review.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not submit for review.')
    }
  }

  const handleSaveDraft = () => {
    if (!currentUser) return
    try {
      if (project.status === 'Qualified') {
        saveQualifiedDraft(project.id, currentUser)
      }
      toast.success('Draft saved.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save draft.')
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-stone-900">Tool Selection</div>
          <p className="text-xs text-stone-500">
            {editable
              ? 'Generate recommendations from the live catalog, pick a combo or customise the stack, then submit for review.'
              : 'Read-only stack and rationale after submission.'}
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => {
                generateRecommendations(true)
                toast.success('Recommendations regenerated.')
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Re-generate
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-8 text-xs"
              onClick={onCustomiseStack}
            >
              Customise Stack
            </Button>
            {project.status === 'Qualified' && (
              <Button
                type="button"
                variant="ghost"
                className="h-8 text-xs"
                onClick={handleSaveDraft}
              >
                Save draft
              </Button>
            )}
            <Button
              type="button"
              className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700"
              onClick={handleSubmitForReview}
            >
              Submit for review
            </Button>
          </div>
        )}
        {editable && !canEdit && currentUser && (
          <div className="flex items-start gap-1.5 rounded-md border-[0.5px] border-[#CECBF6] bg-[#EEEDFE] px-2.5 py-2 text-[11px] text-[#26215C]">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            You are viewing as {humanizeRole(currentUser.role)}. Only the submitter, Data
            Engineering, AI Program Manager, or Admin can select tools.
          </div>
        )}
      </div>

      {(project.status === 'ForEHSReview' ||
        project.status === 'Submitted' ||
        project.status === 'Rejected' ||
        project.status === 'EHSRejected') && (
        <StatusGateActions project={project} currentUser={currentUser} />
      )}

      <div className="rounded-md bg-stone-50 px-3 py-2">
        <span className="mb-1 block text-[10px] text-stone-500">Current stack</span>
        <ToolStackChips toolStack={project.toolStack} tools={tools} showLabels />
      </div>

      {displayedCombos.length > 0 && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {displayedCombos.map((combo, index) => (
            <ComboCard
              key={combo.id}
              combo={combo}
              tools={tools}
              index={index}
              selected={comboMatchesStack(project.toolStack, combo)}
              onSelect={() => {
                if (!canEdit) return
                onApplyCombo(combo.id)
              }}
            />
          ))}
        </div>
      )}

      <div className="rounded-lg border-[0.5px] border-stone-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-stone-900">
          <Sparkles className="h-4 w-4 text-indigo-600" />
          Top tool rankings
        </div>
        {canEdit ? (
          <div className="mb-3.5 grid grid-cols-1 gap-3 lg:grid-cols-3">
            {project.recommendations.map((recommendation) => {
              const tool = tools.find((item) => item.id === recommendation.toolId)
              if (!tool) return null
              return (
                <ToolRankingCard
                  key={recommendation.toolId}
                  recommendation={recommendation}
                  tool={tool}
                  trainings={resolvedTrainings}
                  stack={project.toolStack}
                  onStackChange={handleStackChange}
                />
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {project.recommendations.map((rec) => {
              const tool = tools.find((item) => item.id === rec.toolId)
              if (!tool) return null
              return (
                <div
                  key={rec.toolId}
                  className="rounded-md border-[0.5px] border-stone-200 bg-stone-50 p-3 text-[11px]"
                >
                  <div className="font-medium text-stone-900">
                    #{rec.rank} {tool.name}
                  </div>
                  <div className="text-stone-500">{Math.round(rec.confidence * 100)}% confidence</div>
                  <p className="mt-1 text-stone-600">{rec.rationale}</p>
                </div>
              )
            })}
          </div>
        )}

        {canEdit && project.alternativeRecommendations.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {project.alternativeRecommendations.map((recommendation) => {
              const tool = tools.find((item) => item.id === recommendation.toolId)
              if (!tool) return null
              return (
                <AlternativeToolCard
                  key={recommendation.toolId}
                  recommendation={recommendation}
                  tool={tool}
                  stack={project.toolStack}
                  onStackChange={handleStackChange}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/** @deprecated Use ProjectToolSelectionTab — kept as alias during Phase 4 rename. */
export const ProjectRecommendationsTab = ProjectToolSelectionTab

export function ProjectBenefitsTab({
  project,
  currentUser,
  onReportBenefits,
}: Pick<ProjectTabsProps, 'project' | 'currentUser' | 'onReportBenefits'>) {
  const [hoursInput, setHoursInput] = useState(
    project.reportedBenefitHours?.toString() ?? '',
  )

  const canReport =
    project.status === 'Active' &&
    currentUser !== null &&
    (currentUser.role === 'Admin' ||
      currentUser.id === project.submitterId ||
      currentUser.id === project.businessAnalystId ||
      currentUser.role === 'DataEngineering' ||
      currentUser.role === 'AIProgramManager')

  const expected = project.submission.expectedBenefitHours
  const reported = project.reportedBenefitHours
  const approvalEntry = [...project.auditLog]
    .reverse()
    .find(
      (entry) =>
        project.sponsorDecision === 'Approved' &&
        entry.toStatus === 'Completed' &&
        entry.toStage === 'Use',
    )

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-lg border-[0.5px] border-stone-200 bg-white p-4">
        <div className="mb-3 text-sm font-medium text-stone-900">Expected vs reported benefit</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md bg-stone-100 p-3">
            <div className="text-[10px] text-stone-500">Expected (submission)</div>
            <div className="text-lg font-semibold text-stone-900">{expected} hrs/month</div>
          </div>
          <div className="rounded-md bg-indigo-50 p-3">
            <div className="text-[10px] text-stone-500">Reported (actual)</div>
            <div className="text-lg font-semibold text-indigo-900">
              {reported !== null ? `${reported} hrs/month` : 'Not reported yet'}
            </div>
          </div>
        </div>
      </div>

      {canReport && (
        <div className="rounded-lg border-[0.5px] border-stone-200 bg-white p-4">
          <div className="mb-2 text-sm font-medium text-stone-900">Report benefits</div>
          <p className="mb-3 text-xs text-stone-600">
            Enter actual benefit hours, then use Status gate actions → Submit for sponsor approval.
          </p>
          <label className="mb-1.5 block text-[11px] text-stone-700">
            Reported benefit hours per month
          </label>
          <Input
            type="number"
            min={0}
            value={hoursInput}
            onChange={(event) => setHoursInput(event.target.value)}
            className="mb-3 h-9 max-w-xs text-xs"
          />
          <Button
            type="button"
            className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700"
            onClick={() => {
              const hours = Number(hoursInput)
              if (!hours || hours <= 0) {
                toast.error('Enter a valid number of hours.')
                return
              }
              onReportBenefits(hours)
            }}
          >
            Save benefit hours
          </Button>
        </div>
      )}

      {project.status === 'ForSponsorApproval' && (
        <div className="rounded-lg border-[0.5px] border-stone-200 bg-white p-4">
          <div className="mb-2 text-sm font-medium text-stone-900">Awaiting sponsor decision</div>
          <p className="text-xs text-stone-600">
            Reported <strong>{reported ?? '—'} hrs/month</strong>
            {project.sponsorId
              ? ` · Sponsor: ${getUserDisplayName(project.sponsorId)}`
              : ' · Sponsor unassigned'}
            . Use Status gate actions to Approve or Disapprove.
          </p>
        </div>
      )}

      {project.status === 'Disapproved' && (
        <div className="rounded-lg border-[0.5px] border-red-200 bg-red-50 p-4">
          <div className="mb-2 text-sm font-medium text-red-900">Sponsor disapproved</div>
          <p className="text-xs text-red-800">
            {project.sponsorDecisionNote || 'No reason recorded.'}
          </p>
        </div>
      )}

      {project.status === 'Completed' && (
        <div className="rounded-lg border-[0.5px] border-green-200 bg-green-50 p-4">
          <div className="mb-2 text-sm font-medium text-green-900">Closure summary</div>
          <div className="space-y-1.5 text-xs text-green-900">
            <p>
              Reported benefit: <strong>{reported ?? '—'} hrs/month</strong>
            </p>
            <p>
              Sponsor decision:{' '}
              <strong>{project.sponsorDecision ?? 'Approved'}</strong>
              {project.sponsorId ? ` · ${getUserDisplayName(project.sponsorId)}` : ''}
            </p>
            {approvalEntry && (
              <p className="text-green-800">
                Closed {formatDateTime(approvalEntry.timestamp)} by{' '}
                {humanizeRole(approvalEntry.actorRole)}
              </p>
            )}
            {project.tier && (
              <p className="flex items-center gap-2">
                Tier: <TierBadge tier={project.tier} />
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function ProjectAuditLogTab({ project }: Pick<ProjectTabsProps, 'project'>) {
  const entries = [...project.auditLog].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  return (
    <div className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Timestamp</TableHead>
            <TableHead className="text-xs">Actor</TableHead>
            <TableHead className="text-xs">From → To</TableHead>
            <TableHead className="text-xs">Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const actorName = getUserDisplayName(entry.actorUserId)
            const fromLabel = entry.fromStage
              ? `${humanizeStage(entry.fromStage)} (${entry.fromStatus ?? '—'})`
              : '—'
            const toLabel = `${humanizeStage(entry.toStage)} (${entry.toStatus})`
            return (
              <TableRow key={entry.id}>
                <TableCell className="text-xs">
                  <div>{formatDateTime(entry.timestamp)}</div>
                  <div className="text-[10px] text-stone-500">
                    {formatRelative(entry.timestamp)}
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  <div className="font-medium text-stone-900">{actorName}</div>
                  <RoleBadge role={entry.actorRole} className="mt-1" />
                </TableCell>
                <TableCell className="text-xs">
                  {fromLabel} → {toLabel}
                </TableCell>
                <TableCell className="max-w-xs text-xs text-stone-600">{entry.note}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
