import { useMemo, useState } from 'react'
import { Info, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog'
import { Button } from '@/components/ui/button'
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
import { SEED_USERS } from '@/data/seedRoles'
import { getUserDisplayName } from '@/lib/projectDisplay'
import { canOwnStack } from '@/lib/tiering'
import { humanizeRole, cn } from '@/lib/utils'
import { useProjectsStore } from '@/stores/projectsStore'
import type { Project, User } from '@/types'

const REVIEW_ROLES: User['role'][] = ['GovernanceLead', 'AIProgramManager', 'Admin']
const EHS_ROLES: User['role'][] = ['EHS', 'Admin']

type GateDialog =
  | { kind: 'approve' }
  | { kind: 'reject' }
  | { kind: 'ehsApprove' }
  | { kind: 'ehsReject' }
  | { kind: 'resubmit' }
  | { kind: 'submitSponsor' }
  | { kind: 'sponsorApprove' }
  | { kind: 'sponsorDisapprove' }
  | { kind: 'reviseDisapproval' }
  | { kind: 'reactivate' }
  | null

type StatusGateActionsProps = {
  project: Project
  currentUser: User | null
}

function canClosureOwner(user: User, project: Project): boolean {
  if (user.role === 'Admin') return true
  if (user.id === project.submitterId) return true
  return user.role === 'DataEngineering' || user.role === 'AIProgramManager'
}

function canSponsorAct(user: User, project: Project): boolean {
  if (user.role === 'Admin') return true
  if (user.role === 'Sponsor' && project.sponsorId && user.id === project.sponsorId) return true
  if (user.role === 'Sponsor' && !project.sponsorId) return true
  return false
}

export function StatusGateActions({ project, currentUser }: StatusGateActionsProps) {
  const assignEhsCoordinator = useProjectsStore((s) => s.assignEhsCoordinator)
  const approveSubmission = useProjectsStore((s) => s.approveSubmission)
  const rejectSubmission = useProjectsStore((s) => s.rejectSubmission)
  const ehsApprove = useProjectsStore((s) => s.ehsApprove)
  const ehsReject = useProjectsStore((s) => s.ehsReject)
  const resubmitAfterRejection = useProjectsStore((s) => s.resubmitAfterRejection)
  const submitForSponsorApproval = useProjectsStore((s) => s.submitForSponsorApproval)
  const sponsorApprove = useProjectsStore((s) => s.sponsorApprove)
  const sponsorDisapprove = useProjectsStore((s) => s.sponsorDisapprove)
  const reviseAfterDisapproval = useProjectsStore((s) => s.reviseAfterDisapproval)
  const reactivateProject = useProjectsStore((s) => s.reactivateProject)

  const [dialog, setDialog] = useState<GateDialog>(null)
  const [reason, setReason] = useState('')
  const [ehsPick, setEhsPick] = useState<string>(project.ehsCoordinatorId ?? '__none__')
  const [sponsorPick, setSponsorPick] = useState<string>(project.sponsorId ?? '')
  const [hoursInput, setHoursInput] = useState(
    project.reportedBenefitHours?.toString() ?? '',
  )

  const ehsUsers = useMemo(() => SEED_USERS.filter((u) => u.role === 'EHS'), [])
  const sponsors = useMemo(() => SEED_USERS.filter((u) => u.role === 'Sponsor'), [])

  const canReview = currentUser !== null && REVIEW_ROLES.includes(currentUser.role)
  const canEhs = currentUser !== null && EHS_ROLES.includes(currentUser.role)
  const canResubmit =
    currentUser !== null &&
    (canOwnStack(project, currentUser) || canClosureOwner(currentUser, project))
  const canSubmitClosure = currentUser !== null && canClosureOwner(currentUser, project)
  const canSponsor = currentUser !== null && canSponsorAct(currentUser, project)
  const canReactivate =
    currentUser !== null &&
    (currentUser.role === 'Admin' ||
      currentUser.role === 'GovernanceLead' ||
      canClosureOwner(currentUser, project) ||
      canOwnStack(project, currentUser))

  const relevantStatuses = new Set([
    'Submitted',
    'ForEHSReview',
    'Rejected',
    'EHSRejected',
    'Active',
    'ForSponsorApproval',
    'Disapproved',
    'Idle',
    'Deactivated',
  ])
  if (!relevantStatuses.has(project.status)) {
    return null
  }

  const runSafe = (fn: () => void, success: string) => {
    try {
      fn()
      toast.success(success)
      setDialog(null)
      setReason('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed.')
    }
  }

  const hoursReady =
    project.reportedBenefitHours !== null && project.reportedBenefitHours > 0

  const awaitingNote = (() => {
    if (project.status === 'Submitted' && !canReview) {
      return `Awaiting ${humanizeRole('GovernanceLead')} / ${humanizeRole('AIProgramManager')} review.`
    }
    if (project.status === 'ForEHSReview' && !canEhs) {
      return 'Awaiting EHS review.'
    }
    if (
      (project.status === 'Rejected' || project.status === 'EHSRejected') &&
      !canResubmit
    ) {
      return 'Awaiting submitter revision and resubmit.'
    }
    if (project.status === 'Active' && !canSubmitClosure) {
      return 'Awaiting owner to report benefits and submit for sponsor approval.'
    }
    if (project.status === 'Active' && canSubmitClosure && !hoursReady) {
      return 'Report benefit hours on the Benefits & Closure tab before submitting for sponsor approval.'
    }
    if (project.status === 'ForSponsorApproval' && !canSponsor) {
      return 'Awaiting sponsor approval.'
    }
    if (project.status === 'Disapproved' && !canSubmitClosure) {
      return 'Awaiting owner revision after sponsor disapproval.'
    }
    if (
      (project.status === 'Idle' || project.status === 'Deactivated') &&
      !canReactivate
    ) {
      return 'Awaiting owner or Governance to reactivate.'
    }
    return null
  })()

  return (
    <div className="mb-3.5 border-t-[0.5px] border-stone-200 pt-3.5">
      <div className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold text-stone-900">
        <ShieldCheck className="h-3.5 w-3.5 text-indigo-700" />
        Status gate actions
        {project.status === 'Submitted' && (
          <span
            className={cn(
              'ml-1 rounded-sm border-[0.5px] px-1.5 py-0.5 text-[10px] font-semibold uppercase',
              project.ehsCoordinatorId
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-stone-200 bg-stone-50 text-stone-600',
            )}
          >
            {project.ehsCoordinatorId ? 'EHS required' : 'EHS optional'}
          </span>
        )}
      </div>

      {project.status === 'Submitted' && project.ehsCoordinatorId && (
        <p className="mb-2 text-[11px] text-stone-600">
          EHS coordinator: {getUserDisplayName(project.ehsCoordinatorId)} — approval will route to
          EHS review.
        </p>
      )}

      {awaitingNote && (
        <div className="mb-2.5 flex items-start gap-1.5 rounded-md border-[0.5px] border-[#CECBF6] bg-[#EEEDFE] px-2.5 py-2 text-[11px] text-[#26215C]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {awaitingNote}
        </div>
      )}

      {project.status === 'Submitted' && canReview && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700"
            onClick={() => {
              setEhsPick(project.ehsCoordinatorId ?? '__none__')
              setDialog({ kind: 'approve' })
            }}
          >
            Approve
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-8 text-xs"
            onClick={() => setDialog({ kind: 'reject' })}
          >
            Reject
          </Button>
        </div>
      )}

      {project.status === 'ForEHSReview' && canEhs && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700"
            onClick={() => setDialog({ kind: 'ehsApprove' })}
          >
            EHS Approve
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-8 text-xs"
            onClick={() => setDialog({ kind: 'ehsReject' })}
          >
            EHS Reject
          </Button>
        </div>
      )}

      {(project.status === 'Rejected' || project.status === 'EHSRejected') && canResubmit && (
        <Button
          type="button"
          className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700"
          onClick={() => setDialog({ kind: 'resubmit' })}
        >
          Revise & resubmit
        </Button>
      )}

      {project.status === 'Active' && canSubmitClosure && (
        <Button
          type="button"
          className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700 disabled:opacity-50"
          disabled={!hoursReady}
          onClick={() => {
            setSponsorPick(project.sponsorId ?? sponsors[0]?.id ?? '')
            setHoursInput(project.reportedBenefitHours?.toString() ?? '')
            setDialog({ kind: 'submitSponsor' })
          }}
        >
          Submit for sponsor approval
        </Button>
      )}

      {project.status === 'ForSponsorApproval' && canSponsor && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700"
            onClick={() => setDialog({ kind: 'sponsorApprove' })}
          >
            Approve
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-8 text-xs"
            onClick={() => setDialog({ kind: 'sponsorDisapprove' })}
          >
            Disapprove
          </Button>
        </div>
      )}

      {project.status === 'Disapproved' && canSubmitClosure && (
        <Button
          type="button"
          className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700"
          onClick={() => setDialog({ kind: 'reviseDisapproval' })}
        >
          Revise & resubmit
        </Button>
      )}

      {(project.status === 'Idle' || project.status === 'Deactivated') && canReactivate && (
        <Button
          type="button"
          className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700"
          onClick={() => setDialog({ kind: 'reactivate' })}
        >
          Reactivate
        </Button>
      )}

      <ConfirmDialog
        open={dialog?.kind === 'approve'}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        title="Approve submission"
        description={
          <div className="space-y-3 text-left">
            <p>
              Optionally assign an EHS coordinator. If assigned, the project goes to{' '}
              <strong>For EHS Review</strong>; if left blank, it becomes <strong>Active</strong>.
            </p>
            <div>
              <Label className="mb-1.5 block text-[11px] text-stone-600">EHS coordinator</Label>
              <Select value={ehsPick} onValueChange={setEhsPick}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="None — skip EHS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None — skip EHS</SelectItem>
                  {ehsUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        }
        confirmLabel="Approve"
        onConfirm={() => {
          if (!currentUser) return
          const ehsId = ehsPick === '__none__' ? null : ehsPick
          runSafe(() => {
            assignEhsCoordinator(project.id, ehsId, currentUser)
            approveSubmission(project.id, currentUser)
          }, ehsId ? 'Routed to EHS review.' : 'Project activated.')
        }}
      />

      <ConfirmDialog
        open={dialog?.kind === 'reject'}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null)
            setReason('')
          }
        }}
        title="Reject submission"
        description={
          <div className="space-y-2 text-left">
            <p>Provide a reason the submitter can act on.</p>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px] text-xs"
              placeholder="Rejection reason…"
            />
          </div>
        }
        confirmLabel="Reject"
        variant="destructive"
        onConfirm={() => {
          if (!currentUser) return false
          if (!reason.trim()) {
            toast.error('A rejection reason is required.')
            return false
          }
          runSafe(
            () => rejectSubmission(project.id, reason, currentUser),
            'Submission rejected.',
          )
        }}
      />

      <ConfirmDialog
        open={dialog?.kind === 'ehsApprove'}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        title="EHS approve"
        description="Confirm EHS clearance. The project will become Active and Development will start."
        confirmLabel="EHS Approve"
        onConfirm={() => {
          if (!currentUser) return
          runSafe(() => ehsApprove(project.id, currentUser), 'EHS approved — project activated.')
        }}
      />

      <ConfirmDialog
        open={dialog?.kind === 'ehsReject'}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null)
            setReason('')
          }
        }}
        title="EHS reject"
        description={
          <div className="space-y-2 text-left">
            <p>Provide the EHS rejection reason.</p>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px] text-xs"
              placeholder="EHS rejection reason…"
            />
          </div>
        }
        confirmLabel="EHS Reject"
        variant="destructive"
        onConfirm={() => {
          if (!currentUser) return false
          if (!reason.trim()) {
            toast.error('An EHS rejection reason is required.')
            return false
          }
          runSafe(() => ehsReject(project.id, reason, currentUser), 'EHS rejected.')
        }}
      />

      <ConfirmDialog
        open={dialog?.kind === 'resubmit'}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        title="Revise & resubmit"
        description="Return this project to Submitted for another review cycle. Ensure the tool stack reflects any required changes."
        confirmLabel="Resubmit"
        onConfirm={() => {
          if (!currentUser) return
          runSafe(
            () => resubmitAfterRejection(project.id, currentUser),
            'Resubmitted for review.',
          )
        }}
      />

      <ConfirmDialog
        open={dialog?.kind === 'submitSponsor'}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        title="Submit for sponsor approval"
        description={
          <div className="space-y-3 text-left">
            <p>Confirm reported benefit hours and assign a sponsor if needed.</p>
            <div>
              <Label className="mb-1.5 block text-[11px] text-stone-600">
                Reported benefit hours / month
              </Label>
              <Input
                type="number"
                min={1}
                value={hoursInput}
                onChange={(e) => setHoursInput(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            {!project.sponsorId && (
              <div>
                <Label className="mb-1.5 block text-[11px] text-stone-600">Sponsor</Label>
                <Select value={sponsorPick} onValueChange={setSponsorPick}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select sponsor" />
                  </SelectTrigger>
                  <SelectContent>
                    {sponsors.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {project.sponsorId && (
              <p className="text-[11px] text-stone-600">
                Sponsor: {getUserDisplayName(project.sponsorId)}
              </p>
            )}
          </div>
        }
        confirmLabel="Submit"
        onConfirm={() => {
          if (!currentUser) return false
          const hours = Number(hoursInput)
          if (!hours || hours <= 0) {
            toast.error('Enter valid benefit hours.')
            return false
          }
          const sponsorId = project.sponsorId ?? (sponsorPick || null)
          runSafe(
            () =>
              submitForSponsorApproval(
                project.id,
                { reportedBenefitHours: hours, sponsorId },
                currentUser,
              ),
            'Submitted for sponsor approval.',
          )
        }}
      />

      <ConfirmDialog
        open={dialog?.kind === 'sponsorApprove'}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        title="Approve closure"
        description={
          <span>
            Confirm benefits of{' '}
            <strong>{project.reportedBenefitHours ?? '—'} hrs/month</strong> and complete the
            project.
          </span>
        }
        confirmLabel="Approve"
        onConfirm={() => {
          if (!currentUser) return
          runSafe(() => sponsorApprove(project.id, currentUser), 'Project completed.')
        }}
      />

      <ConfirmDialog
        open={dialog?.kind === 'sponsorDisapprove'}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null)
            setReason('')
          }
        }}
        title="Disapprove closure"
        description={
          <div className="space-y-2 text-left">
            <p>Provide a reason so the team can revise.</p>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px] text-xs"
              placeholder="Disapproval reason…"
            />
          </div>
        }
        confirmLabel="Disapprove"
        variant="destructive"
        onConfirm={() => {
          if (!currentUser) return false
          if (!reason.trim()) {
            toast.error('A disapproval reason is required.')
            return false
          }
          runSafe(
            () => sponsorDisapprove(project.id, reason, currentUser),
            'Closure disapproved.',
          )
        }}
      />

      <ConfirmDialog
        open={dialog?.kind === 'reviseDisapproval'}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        title="Revise after disapproval"
        description="Return the project to Active so the team can address the sponsor’s feedback."
        confirmLabel="Return to Active"
        onConfirm={() => {
          if (!currentUser) return
          runSafe(
            () => reviseAfterDisapproval(project.id, currentUser),
            'Returned to Active.',
          )
        }}
      />

      <ConfirmDialog
        open={dialog?.kind === 'reactivate'}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        title="Reactivate project"
        description="Return this project to Active and reset the aging clock (lastActivityAt)."
        confirmLabel="Reactivate"
        onConfirm={() => {
          if (!currentUser) return
          runSafe(() => reactivateProject(project.id, currentUser), 'Project reactivated.')
        }}
      />
    </div>
  )
}
