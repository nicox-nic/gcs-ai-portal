import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  QUALIFICATION_EXCLUSIONS,
  QUALIFICATION_PRIMARY,
  QUALIFICATION_SUPPORTING,
  READINESS_DESIRABILITY,
  READINESS_FEASIBILITY,
  READINESS_MET_THRESHOLD,
  READINESS_VIABILITY,
  REWARD_CATEGORY_OPTIONS,
  RISK_TIER_OPTIONS,
  emptyQualification,
  emptyReadiness,
} from '@/lib/qualificationCriteria'
import { canQualify, qualifiesAsAI, scoreReadiness, suggestTier } from '@/lib/qualificationLogic'
import { formatDateTime, humanizeRole, cn } from '@/lib/utils'
import { getUserDisplayName } from '@/lib/projectDisplay'
import { SEED_USERS } from '@/data/seedRoles'
import type {
  Project,
  QualificationAssessment,
  ReadinessAssessment,
  RewardCategory,
  RiskLevel,
  User,
} from '@/types'

const REVIEWER_ROLES: User['role'][] = ['GovernanceLead', 'RiskCompliance', 'Admin']

const QUALIFICATION_TAB_STATUSES = new Set([
  'ForAssessment',
  'NotQualified',
  'Qualified',
  'QualifiedDraft',
  'Submitted',
  'ForEHSReview',
  'EHSRejected',
  'Active',
  'ForSponsorApproval',
  'Completed',
])

export function showQualificationTab(status: Project['status']): boolean {
  return QUALIFICATION_TAB_STATUSES.has(status)
}

type DecisionKind = 'qualify' | 'reject' | 'cancel' | 'resubmit' | null

type ProjectQualificationTabProps = {
  project: Project
  currentUser: User | null
  onQualify: (payload: {
    readiness: ReadinessAssessment
    qualification: QualificationAssessment
    tierRationale: string
    rewardCategory: RewardCategory
    businessAnalystId?: string | null
    dataEngineerId?: string | null
    programManagerId?: string | null
  }) => void
  onReject: (reason: string) => void
  onCancel: (reason: string) => void
  onResubmit: () => void
}

function MetChip({ met }: { met: boolean }) {
  return (
    <span
      className={cn(
        'rounded-sm border-[0.5px] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        met
          ? 'border-green-200 bg-green-50 text-green-900'
          : 'border-amber-200 bg-amber-50 text-amber-800',
      )}
    >
      {met ? 'Met' : 'Not met'}
    </span>
  )
}

function ChecklistGroup({
  title,
  items,
  values,
  onToggle,
  readOnly,
}: {
  title: string
  items: readonly string[] | readonly { id: string; label: string }[]
  values: boolean[]
  onToggle?: (index: number, checked: boolean) => void
  readOnly?: boolean
}) {
  return (
    <div className="mb-4">
      <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
        {title}
      </h4>
      <div className="space-y-2">
        {items.map((item, index) => {
          const label = typeof item === 'string' ? item : `${item.id} — ${item.label}`
          return (
            <label
              key={label}
              className={cn(
                'flex items-start gap-2 text-xs text-stone-700',
                readOnly && 'opacity-90',
              )}
            >
              <Checkbox
                checked={values[index] ?? false}
                disabled={readOnly}
                onCheckedChange={(checked) => onToggle?.(index, checked === true)}
                className="mt-0.5"
              />
              <span>{label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

function ReadOnlySummary({ project }: { project: Project }) {
  const readiness = project.readiness
  const qualification = project.qualification
  const scores = readiness ? scoreReadiness(readiness) : null
  const decisionEntry = [...project.auditLog]
    .reverse()
    .find(
      (entry) =>
        entry.note.toLowerCase().includes('qualified') ||
        entry.note.toLowerCase().includes('not qualified'),
    )

  return (
    <div className="space-y-4 p-4">
      <div>
        <h3 className="text-sm font-medium text-stone-900">Qualification summary</h3>
        <p className="mt-1 text-xs text-stone-500">
          Read-only record of the governance assessment decision.
        </p>
      </div>

      {scores && readiness ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ['Feasibility', scores.feasibility, scores.feasibilityMet],
              ['Viability', scores.viability, scores.viabilityMet],
              ['Desirability', scores.desirability, scores.desirabilityMet],
            ] as const
          ).map(([label, score, met]) => (
            <div
              key={label}
              className="rounded-md border-[0.5px] border-stone-200 bg-stone-50 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-stone-700">{label}</span>
                <MetChip met={met} />
              </div>
              <p className="mt-1 text-xs text-stone-900">
                {score} / 7 (need ≥ {READINESS_MET_THRESHOLD})
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-stone-500">No readiness assessment recorded.</p>
      )}

      {qualification && (
        <div className="rounded-md border-[0.5px] border-stone-200 bg-white p-3 text-xs text-stone-700">
          <p className="mb-2 font-medium text-stone-900">
            {qualifiesAsAI(qualification)
              ? 'Qualifies as AI project (Section A met)'
              : 'Not an AI project determination'}
          </p>
          <p>
            A criteria met:{' '}
            {QUALIFICATION_PRIMARY.filter((_, i) => qualification.primary[i])
              .map((item) => item.id)
              .join(', ') || 'none'}
          </p>
          <p className="mt-1">
            B flags:{' '}
            {QUALIFICATION_SUPPORTING.filter((_, i) => qualification.supporting[i])
              .map((item) => item.id)
              .join(', ') || 'none'}
          </p>
          <p className="mt-1">
            C exclusions:{' '}
            {QUALIFICATION_EXCLUSIONS.filter((_, i) => qualification.exclusions[i])
              .map((item) => item.id)
              .join(', ') || 'none'}
          </p>
        </div>
      )}

      <dl className="grid gap-3 sm:grid-cols-2 text-xs">
        <div>
          <dt className="text-stone-500">Risk classification (Section D)</dt>
          <dd className="mt-0.5 font-medium text-stone-900">
            {qualification?.riskTier ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">Delivery tier</dt>
          <dd className="mt-0.5 font-medium text-stone-900">
            {project.tier ?? 'Not yet assigned'}
          </dd>
          {project.tierRationale && (
            <dd className="mt-1 text-stone-600">{project.tierRationale}</dd>
          )}
        </div>
        <div>
          <dt className="text-stone-500">Reward category</dt>
          <dd className="mt-0.5 font-medium text-stone-900">
            {project.rewardCategory ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">Decision</dt>
          <dd className="mt-0.5 font-medium text-stone-900">{project.status}</dd>
        </div>
        {decisionEntry && (
          <div>
            <dt className="text-stone-500">Decided by</dt>
            <dd className="mt-0.5 text-stone-900">
              {getUserDisplayName(decisionEntry.actorUserId)} ·{' '}
              {humanizeRole(decisionEntry.actorRole)} · {formatDateTime(decisionEntry.timestamp)}
            </dd>
            <dd className="mt-1 text-stone-600">{decisionEntry.note}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}

export function ProjectQualificationTab({
  project,
  currentUser,
  onQualify,
  onReject,
  onCancel,
  onResubmit,
}: ProjectQualificationTabProps) {
  const canReview =
    currentUser !== null && REVIEWER_ROLES.includes(currentUser.role)
  const interactive = project.status === 'ForAssessment' && canReview
  const suggestedRisk = useMemo(
    () => suggestTier(project.submission),
    [project.submission],
  )

  const [readiness, setReadiness] = useState<ReadinessAssessment>(
    () => project.readiness ?? emptyReadiness(),
  )
  const [qualification, setQualification] = useState<QualificationAssessment>(
    () =>
      project.qualification ?? {
        ...emptyQualification(),
        riskTier: suggestedRisk,
      },
  )
  const [riskRationale, setRiskRationale] = useState(project.tierRationale || '')
  const [rewardCategory, setRewardCategory] = useState<RewardCategory | null>(
    project.rewardCategory,
  )
  const [reason, setReason] = useState('')
  const [pendingDecision, setPendingDecision] = useState<DecisionKind>(null)
  const [baPick, setBaPick] = useState(project.businessAnalystId ?? '__none__')
  const [dePick, setDePick] = useState(project.dataEngineerId ?? '__none__')
  const [pmPick, setPmPick] = useState(project.programManagerId ?? '__none__')

  const baUsers = SEED_USERS.filter((user) => user.role === 'BusinessAnalyst')
  const deUsers = SEED_USERS.filter((user) => user.role === 'DataEngineering')
  const pmUsers = SEED_USERS.filter((user) => user.role === 'AIProgramManager')
  const scores = scoreReadiness(readiness)
  const isAi = qualifiesAsAI(qualification)
  const qualifyEnabled = canQualify(readiness, qualification, rewardCategory)

  if (project.status !== 'ForAssessment' && (project.readiness || project.qualification || project.tier)) {
    return <ReadOnlySummary project={project} />
  }

  if (project.status === 'ForAssessment' && !canReview) {
    return (
      <div className="p-4">
        <div className="rounded-md border-[0.5px] border-indigo-200 bg-indigo-50 px-3.5 py-3 text-xs text-indigo-900">
          Awaiting Governance qualification. Only{' '}
          {humanizeRole('GovernanceLead')}, {humanizeRole('RiskCompliance')}, or Admin can complete
          the readiness and qualification checklists. You can review the Submission on the Overview
          tab.
        </div>
      </div>
    )
  }

  if (project.status === 'NotQualified') {
    const canResubmit =
      currentUser &&
      (REVIEWER_ROLES.includes(currentUser.role) ||
        currentUser.id === project.submitterId ||
        currentUser.role === 'BusinessAnalyst')
    return (
      <div className="space-y-4 p-4">
        <ReadOnlySummary project={project} />
        {canResubmit && (
          <Button
            type="button"
            className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700"
            onClick={() => setPendingDecision('resubmit')}
          >
            Resubmit for assessment
          </Button>
        )}
        <ConfirmDialog
          open={pendingDecision === 'resubmit'}
          onOpenChange={(open) => {
            if (!open) setPendingDecision(null)
          }}
          title="Resubmit for assessment?"
          description="This returns the project to For Assessment so Governance can re-review."
          confirmLabel="Resubmit"
          onConfirm={() => {
            try {
              onResubmit()
              toast.success('Resubmitted for assessment.')
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Could not resubmit.')
            }
          }}
        />
      </div>
    )
  }

  if (!interactive) {
    return <ReadOnlySummary project={project} />
  }

  const toggleReadiness = (
    dim: keyof ReadinessAssessment,
    index: number,
    checked: boolean,
  ) => {
    setReadiness((previous) => ({
      ...previous,
      [dim]: previous[dim].map((value, i) => (i === index ? checked : value)),
    }))
  }

  const toggleQualification = (
    section: 'primary' | 'supporting' | 'exclusions',
    index: number,
    checked: boolean,
  ) => {
    setQualification((previous) => ({
      ...previous,
      [section]: previous[section].map((value, i) => (i === index ? checked : value)),
    }))
  }

  const setRisk = (risk: RiskLevel) => {
    setQualification((previous) => ({ ...previous, riskTier: risk }))
  }

  return (
    <div className="space-y-5 p-4">
      <div>
        <h3 className="text-sm font-medium text-stone-900">Governance qualification</h3>
        <p className="mt-1 text-xs text-stone-500">
          Complete AI Readiness and Qualification checklists, assign risk classification and reward
          category, then decide. Delivery tier is assigned later by Data Engineering.
        </p>
      </div>

      <section className="rounded-lg border-[0.5px] border-stone-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-stone-900">AI Readiness</h4>
          <div className="flex flex-wrap gap-2">
            <MetChip met={scores.feasibilityMet} />
            <span className="text-[11px] text-stone-500">
              F {scores.feasibility}/7 · V {scores.viability}/7 · D {scores.desirability}/7
            </span>
            <span
              className={cn(
                'rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                scores.allMet
                  ? 'bg-green-50 text-green-900'
                  : 'bg-stone-100 text-stone-600',
              )}
            >
              {scores.allMet ? 'All dimensions met' : 'Not ready to qualify'}
            </span>
          </div>
        </div>
        <ChecklistGroup
          title={`Feasibility (${scores.feasibility}/7)`}
          items={READINESS_FEASIBILITY}
          values={readiness.feasibility}
          onToggle={(index, checked) => toggleReadiness('feasibility', index, checked)}
        />
        <ChecklistGroup
          title={`Viability (${scores.viability}/7)`}
          items={READINESS_VIABILITY}
          values={readiness.viability}
          onToggle={(index, checked) => toggleReadiness('viability', index, checked)}
        />
        <ChecklistGroup
          title={`Desirability (${scores.desirability}/7)`}
          items={READINESS_DESIRABILITY}
          values={readiness.desirability}
          onToggle={(index, checked) => toggleReadiness('desirability', index, checked)}
        />
      </section>

      <section className="rounded-lg border-[0.5px] border-stone-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-stone-900">AI Qualification</h4>
          <span
            className={cn(
              'rounded-sm border-[0.5px] px-2 py-0.5 text-[10px] font-semibold uppercase',
              isAi
                ? 'border-green-200 bg-green-50 text-green-900'
                : 'border-amber-200 bg-amber-50 text-amber-800',
            )}
          >
            {isAi
              ? 'Qualifies as AI project'
              : 'Not an AI project (digital/automation/kaizen/IT)'}
          </span>
        </div>
        <ChecklistGroup
          title="Section A — Primary (any true ⇒ AI)"
          items={QUALIFICATION_PRIMARY}
          values={qualification.primary}
          onToggle={(index, checked) => toggleQualification('primary', index, checked)}
        />
        <ChecklistGroup
          title="Section B — Supporting"
          items={QUALIFICATION_SUPPORTING}
          values={qualification.supporting}
          onToggle={(index, checked) => toggleQualification('supporting', index, checked)}
        />
        {!isAi && (
          <ChecklistGroup
            title="Section C — Exclusions (when no Section A)"
            items={QUALIFICATION_EXCLUSIONS}
            values={qualification.exclusions}
            onToggle={(index, checked) => toggleQualification('exclusions', index, checked)}
          />
        )}
      </section>

      <section className="rounded-lg border-[0.5px] border-stone-200 bg-white p-4">
        <h4 className="mb-2 text-xs font-semibold text-stone-900">Section D — Risk classification</h4>
        <p className="mb-3 text-[11px] text-stone-500">
          Suggested from submission:{' '}
          <span className="font-medium text-stone-800">{suggestedRisk}</span> (hint only —
          Governance may override). Delivery ownership (Tier1/2/3) is not set here.
        </p>
        <div className="space-y-2">
          {RISK_TIER_OPTIONS.map((option) => {
            const selected = qualification.riskTier === option.risk
            return (
              <label
                key={option.risk}
                className={cn(
                  'flex cursor-pointer gap-2 rounded-md border-[0.5px] px-3 py-2 text-xs',
                  selected
                    ? 'border-indigo-400 bg-indigo-50/50'
                    : 'border-stone-200 bg-white',
                )}
              >
                <input
                  type="radio"
                  name="risk-tier"
                  className="mt-0.5"
                  checked={selected}
                  onChange={() => setRisk(option.risk)}
                />
                <span>
                  <span className="font-medium text-stone-900">{option.risk}</span>
                  <span className="mt-0.5 block text-stone-600">{option.triggers}</span>
                  <span className="mt-0.5 block text-stone-500">
                    Controls: {option.controls}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
        <div className="mt-3">
          <Label className="mb-1.5 text-[11px] text-stone-700">Risk rationale</Label>
          <Textarea
            value={riskRationale}
            onChange={(event) => setRiskRationale(event.target.value)}
            className="min-h-16 text-xs"
            placeholder="Why this risk classification fits the use case"
          />
        </div>
        <div className="mt-3">
          <Label className="mb-1.5 text-[11px] text-stone-700">Reward category</Label>
          <Select
            value={rewardCategory ?? undefined}
            onValueChange={(value) => setRewardCategory(value as RewardCategory)}
          >
            <SelectTrigger className="h-9 w-full text-xs">
              <SelectValue placeholder="Select reward category" />
            </SelectTrigger>
            <SelectContent>
              {REWARD_CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <Label className="mb-1.5 text-[11px] text-stone-700">Business Analyst</Label>
            <Select value={baPick} onValueChange={setBaPick}>
              <SelectTrigger className="h-9 w-full text-xs">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="text-xs">
                  None
                </SelectItem>
                {baUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id} className="text-xs">
                    {user.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {baPick === '__none__' && (
              <p className="mt-1.5 text-[11px] text-amber-800">
                No BA — requirements/UAT need assignment later.
              </p>
            )}
          </div>
          <div>
            <Label className="mb-1.5 text-[11px] text-stone-700">Data Engineer</Label>
            <Select value={dePick} onValueChange={setDePick}>
              <SelectTrigger className="h-9 w-full text-xs">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="text-xs">
                  None
                </SelectItem>
                {deUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id} className="text-xs">
                    {user.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 text-[11px] text-stone-700">Program Manager</Label>
            <Select value={pmPick} onValueChange={setPmPick}>
              <SelectTrigger className="h-9 w-full text-xs">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="text-xs">
                  None
                </SelectItem>
                {pmUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id} className="text-xs">
                    {user.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-end gap-2 border-t-[0.5px] border-stone-200 pt-4">
        <Button
          type="button"
          className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700 disabled:opacity-50"
          disabled={!qualifyEnabled}
          onClick={() => setPendingDecision('qualify')}
        >
          Qualify
        </Button>
        <div className="flex min-w-[200px] flex-1 flex-col gap-1">
          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="h-8 text-xs"
            placeholder="Reason for Not Qualified / Cancel"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-8 text-xs"
          onClick={() => setPendingDecision('reject')}
        >
          Not Qualified
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="h-8 text-xs"
          onClick={() => setPendingDecision('cancel')}
        >
          Cancel project
        </Button>
      </div>

      <ConfirmDialog
        open={pendingDecision === 'qualify'}
        onOpenChange={(open) => {
          if (!open) setPendingDecision(null)
        }}
        title="Qualify this project?"
        description={
          <>
            Marks the project as Qualified, stores the assessment (risk{' '}
            {qualification.riskTier ?? '—'}), and advances Assessment to complete / Policy Not
            Started. Delivery tier remains unassigned until Data Engineering sets it.
          </>
        }
        confirmLabel="Qualify"
        onConfirm={() => {
          if (!rewardCategory) {
            toast.error('Reward category is required.')
            return false
          }
          if (!qualification.riskTier) {
            toast.error('Section D risk classification is required.')
            return false
          }
          try {
            onQualify({
              readiness,
              qualification,
              tierRationale: riskRationale,
              rewardCategory,
              businessAnalystId: baPick === '__none__' ? null : baPick,
              dataEngineerId: dePick === '__none__' ? null : dePick,
              programManagerId: pmPick === '__none__' ? null : pmPick,
            })
            toast.success('Project qualified.')
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not qualify.')
            return false
          }
        }}
      />

      <ConfirmDialog
        open={pendingDecision === 'reject'}
        onOpenChange={(open) => {
          if (!open) setPendingDecision(null)
        }}
        title="Mark Not Qualified?"
        description="Requires a reason. The submitter can revise and resubmit for assessment."
        confirmLabel="Not Qualified"
        variant="destructive"
        onConfirm={() => {
          if (!reason.trim()) {
            toast.error('A reason is required.')
            return false
          }
          try {
            onReject(reason)
            toast.success('Marked Not Qualified.')
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not reject.')
            return false
          }
        }}
      />

      <ConfirmDialog
        open={pendingDecision === 'cancel'}
        onOpenChange={(open) => {
          if (!open) setPendingDecision(null)
        }}
        title="Cancel this project?"
        description="Terminal status. Requires a cancellation reason."
        confirmLabel="Cancel project"
        variant="destructive"
        onConfirm={() => {
          if (!reason.trim()) {
            toast.error('A cancellation reason is required.')
            return false
          }
          try {
            onCancel(reason)
            toast.success('Project cancelled.')
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not cancel.')
            return false
          }
        }}
      />
    </div>
  )
}
