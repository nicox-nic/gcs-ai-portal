import { useEffect, useState } from 'react'
import { ShieldCheck, Plus, Trash2 } from 'lucide-react'
import { nanoid } from 'nanoid'
import { toast } from 'sonner'
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
import { getUserDisplayName } from '@/lib/projectDisplay'
import { formatDateTime } from '@/lib/utils'
import {
  canEditVerification,
  defaultVerificationChecks,
  isVerificationMandatory,
  outcomeFromChecks,
  verificationPassed,
} from '@/lib/verification'
import { useProjectsStore } from '@/stores/projectsStore'
import type { Project, User, VerificationCheck, VerificationResult } from '@/types'

type PanelProps = {
  project: Project
  currentUser: User | null
}

const RESULTS: VerificationResult[] = ['Pass', 'Fail', 'Untested']

function newCheck(): VerificationCheck {
  return { id: `chk-${nanoid(6)}`, description: '', result: 'Untested' }
}

export function VerificationPanel({ project, currentUser }: PanelProps) {
  const saveVerification = useProjectsStore((s) => s.saveVerification)
  const signOffVerification = useProjectsStore((s) => s.signOffVerification)
  const canEdit = canEditVerification(project, currentUser)
  const mandatory = isVerificationMandatory(project)
  const passed = verificationPassed(project)
  const deName = project.dataEngineerId
    ? getUserDisplayName(project.dataEngineerId)
    : 'Unassigned (any DE)'

  const [checks, setChecks] = useState<VerificationCheck[]>(
    () => project.verification?.checks ?? defaultVerificationChecks(),
  )
  const [notes, setNotes] = useState(() => project.verification?.notes ?? '')

  useEffect(() => {
    setChecks(project.verification?.checks ?? defaultVerificationChecks())
    setNotes(project.verification?.notes ?? '')
  }, [project.id, project.verification])

  const derivedOutcome = outcomeFromChecks(checks)
  const signedFail =
    project.verification?.outcome === 'Fail' && project.verification.verifiedBy !== null

  const persist = (nextChecks: VerificationCheck[], nextNotes: string) => {
    if (!currentUser) return
    try {
      saveVerification(
        project.id,
        {
          checks: nextChecks,
          notes: nextNotes,
          outcome: outcomeFromChecks(nextChecks),
        },
        currentUser,
      )
      toast.success('Verification saved.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save verification.')
    }
  }

  const handleSignOff = () => {
    if (!currentUser) return
    try {
      saveVerification(
        project.id,
        {
          checks,
          notes,
          outcome: outcomeFromChecks(checks),
        },
        currentUser,
      )
      signOffVerification(project.id, currentUser)
      toast.success(
        outcomeFromChecks(checks) === 'Fail'
          ? 'Verification signed as Fail — remediate before Deployment can complete.'
          : 'Verification signed off.',
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not sign off verification.')
    }
  }

  const handleSelfAttest = () => {
    if (!currentUser) return
    try {
      const allPass = checks.map((c) => ({ ...c, result: 'Pass' as const }))
      setChecks(allPass)
      saveVerification(project.id, { checks: allPass, notes, outcome: 'Pass' }, currentUser)
      signOffVerification(project.id, currentUser)
      toast.success('Verification self-attested (Tier1).')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not self-attest.')
    }
  }

  return (
    <div className="mb-3 rounded-md border-[0.5px] border-stone-200 bg-white p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-700" aria-hidden />
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-stone-700">
            Tool & Model Verification (DE)
          </h4>
          {passed ? (
            <span className="rounded-sm bg-green-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-green-900">
              Pass
            </span>
          ) : signedFail || derivedOutcome === 'Fail' ? (
            <span className="rounded-sm bg-red-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-800">
              Fail
            </span>
          ) : (
            <span className="rounded-sm bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-800">
              Pending
            </span>
          )}
          {mandatory && (
            <span className="rounded-sm bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-indigo-800">
              Required
            </span>
          )}
        </div>
        <span className="text-[10px] text-stone-500">DE: {deName}</span>
      </div>

      {passed && project.verification?.verifiedAt && (
        <p className="mb-2 text-[10px] text-stone-500">
          Signed off {formatDateTime(project.verification.verifiedAt)}
          {project.verification.verifiedBy
            ? ` · ${getUserDisplayName(project.verification.verifiedBy)}`
            : ''}
        </p>
      )}

      {(signedFail || derivedOutcome === 'Fail') && (
        <div className="mb-2 rounded-md border-[0.5px] border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-900">
          Verification failed — remediate failing checks with Data Engineering, then re-run and
          sign off again. Deployment Complete stays blocked until Pass.
        </div>
      )}

      {canEdit && !passed ? (
        <div className="space-y-2">
          {checks.map((check, index) => (
            <div key={check.id} className="flex flex-wrap items-center gap-1.5">
              <Input
                value={check.description}
                onChange={(e) => {
                  const next = checks.map((row, i) =>
                    i === index ? { ...row, description: e.target.value } : row,
                  )
                  setChecks(next)
                }}
                className="h-8 min-w-[140px] flex-1 text-xs"
                placeholder="Verification check"
              />
              <Select
                value={check.result}
                onValueChange={(value) => {
                  const next = checks.map((row, i) =>
                    i === index ? { ...row, result: value as VerificationResult } : row,
                  )
                  setChecks(next)
                }}
              >
                <SelectTrigger className="h-8 w-[110px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESULTS.map((result) => (
                    <SelectItem key={result} value={result} className="text-xs">
                      {result}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-8 p-0 text-stone-500"
                onClick={() => setChecks(checks.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => setChecks([...checks, newCheck()])}
          >
            <Plus className="h-3.5 w-3.5" />
            Add check
          </Button>
          <div>
            <Label className="mb-1 text-[10px] text-stone-600">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-14 text-xs"
              placeholder="Verification notes"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => persist(checks, notes)}
            >
              Save
            </Button>
            <Button
              type="button"
              className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700"
              onClick={handleSignOff}
              disabled={derivedOutcome === 'Pending' && currentUser?.role !== 'Admin'}
            >
              Sign off verification
            </Button>
            {!mandatory && (
              <Button
                type="button"
                variant="outline"
                className="h-8 text-xs"
                onClick={handleSelfAttest}
              >
                Self-attest (Tier1)
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 text-[11px] text-stone-700">
          {(project.verification?.checks ?? checks).map((check) => (
            <div key={check.id} className="flex items-start gap-2">
              <span className="shrink-0 font-medium text-stone-500">{check.result}</span>
              <span>{check.description}</span>
            </div>
          ))}
          {project.verification?.notes && (
            <p className="text-[10px] text-stone-500">{project.verification.notes}</p>
          )}
          {!canEdit && !passed && (
            <p className="text-[10px] text-stone-500">
              Only the assigned Data Engineer can edit and sign off verification.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
