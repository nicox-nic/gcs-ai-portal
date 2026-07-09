import { useEffect, useState } from 'react'
import { ClipboardCheck, FileText, Plus, Trash2 } from 'lucide-react'
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
import {
  canEditRequirements,
  canEditUat,
  emptyRequirements,
  emptyUat,
  isBaGateMandatory,
  requirementsComplete,
  uatPassed,
} from '@/lib/baArtifacts'
import { getUserDisplayName } from '@/lib/projectDisplay'
import { formatDateTime } from '@/lib/utils'
import { useProjectsStore } from '@/stores/projectsStore'
import type {
  Project,
  RequirementItem,
  RequirementPriority,
  UatCase,
  UatResult,
  User,
} from '@/types'

type PanelProps = {
  project: Project
  currentUser: User | null
}

const PRIORITIES: RequirementPriority[] = ['Must', 'Should', 'Could']
const UAT_RESULTS: UatResult[] = ['Pass', 'Fail', 'Untested']
const UAT_OUTCOMES = ['Pass', 'Fail', 'Pending'] as const

function newRequirementItem(): RequirementItem {
  return { id: `req-${nanoid(6)}`, text: '', priority: 'Must' }
}

function newUatCase(): UatCase {
  return { id: `uat-${nanoid(6)}`, description: '', result: 'Untested' }
}

export function RequirementsPanel({ project, currentUser }: PanelProps) {
  const saveRequirements = useProjectsStore((s) => s.saveRequirements)
  const confirmRequirements = useProjectsStore((s) => s.confirmRequirements)
  const canEdit = canEditRequirements(project, currentUser)
  const mandatory = isBaGateMandatory(project)
  const complete = requirementsComplete(project)
  const baName = project.businessAnalystId
    ? getUserDisplayName(project.businessAnalystId)
    : 'Unassigned'

  const [items, setItems] = useState<RequirementItem[]>(
    () => project.requirements?.items ?? [],
  )
  const [notes, setNotes] = useState(() => project.requirements?.notes ?? '')

  useEffect(() => {
    setItems(project.requirements?.items ?? [])
    setNotes(project.requirements?.notes ?? '')
  }, [project.id, project.requirements])

  const persist = (nextItems: RequirementItem[], nextNotes: string) => {
    if (!currentUser) return
    try {
      saveRequirements(
        project.id,
        { ...(project.requirements ?? emptyRequirements()), items: nextItems, notes: nextNotes },
        currentUser,
      )
      toast.success('Requirements saved.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save requirements.')
    }
  }

  const handleConfirm = () => {
    if (!currentUser) return
    try {
      if (items.length < 1 && currentUser.role !== 'Admin') {
        const seeded = [
          {
            id: `req-${nanoid(6)}`,
            text: 'Self-attested requirements (Tier1).',
            priority: 'Must' as const,
          },
        ]
        saveRequirements(
          project.id,
          { ...(project.requirements ?? emptyRequirements()), items: seeded, notes },
          currentUser,
        )
        setItems(seeded)
      } else if (items !== (project.requirements?.items ?? []) || notes !== (project.requirements?.notes ?? '')) {
        saveRequirements(
          project.id,
          { ...(project.requirements ?? emptyRequirements()), items, notes },
          currentUser,
        )
      }
      confirmRequirements(project.id, currentUser)
      toast.success('Requirements confirmed.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not confirm requirements.')
    }
  }

  const handleSelfAttest = () => {
    if (!currentUser) return
    try {
      if (items.length < 1) {
        const seeded = [
          {
            id: `req-${nanoid(6)}`,
            text: 'Self-attested requirements (Tier1).',
            priority: 'Must' as const,
          },
        ]
        saveRequirements(
          project.id,
          { ...(project.requirements ?? emptyRequirements()), items: seeded, notes },
          currentUser,
        )
        setItems(seeded)
      }
      confirmRequirements(project.id, currentUser)
      toast.success('Requirements self-attested.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not self-attest requirements.')
    }
  }

  return (
    <div className="mb-3 rounded-md border-[0.5px] border-stone-200 bg-white p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-900">
          <FileText className="h-3.5 w-3.5 text-indigo-600" />
          Requirements
          {complete ? (
            <span className="rounded-sm bg-green-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-green-900">
              Confirmed
            </span>
          ) : (
            <span className="rounded-sm bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-800">
              Pending
            </span>
          )}
        </div>
        <span className="text-[10px] text-stone-500">BA: {baName}</span>
      </div>

      {complete && project.requirements?.confirmedAt && (
        <p className="mb-2 text-[10px] text-stone-500">
          Confirmed {formatDateTime(project.requirements.confirmedAt)}
          {project.requirements.confirmedBy
            ? ` · ${getUserDisplayName(project.requirements.confirmedBy)}`
            : ''}
        </p>
      )}

      {canEdit && !complete ? (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.id} className="flex flex-wrap items-center gap-1.5">
              <Input
                value={item.text}
                onChange={(e) => {
                  const next = items.map((row, i) =>
                    i === index ? { ...row, text: e.target.value } : row,
                  )
                  setItems(next)
                }}
                className="h-8 min-w-[140px] flex-1 text-xs"
                placeholder="Requirement text"
              />
              <Select
                value={item.priority}
                onValueChange={(value) => {
                  const next = items.map((row, i) =>
                    i === index ? { ...row, priority: value as RequirementPriority } : row,
                  )
                  setItems(next)
                }}
              >
                <SelectTrigger className="h-8 w-[100px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority} className="text-xs">
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-8 p-0 text-stone-500"
                onClick={() => setItems(items.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => setItems([...items, newRequirementItem()])}
          >
            <Plus className="h-3.5 w-3.5" />
            Add requirement
          </Button>
          <div>
            <Label className="mb-1 text-[10px] text-stone-600">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[56px] text-xs"
              placeholder="Optional notes"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => persist(items, notes)}
            >
              Save draft
            </Button>
            {!mandatory && (
              <Button
                type="button"
                variant="outline"
                className="h-8 text-xs"
                onClick={handleSelfAttest}
              >
                Self-attest requirements
              </Button>
            )}
            <Button
              type="button"
              className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700"
              onClick={handleConfirm}
            >
              Confirm requirements
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 text-[11px] text-stone-700">
          {(project.requirements?.items ?? []).length === 0 ? (
            <p className="text-stone-500">No requirements recorded yet.</p>
          ) : (
            (project.requirements?.items ?? []).map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-2 rounded-md bg-stone-50 px-2.5 py-1.5"
              >
                <span>{item.text}</span>
                <span className="shrink-0 text-[10px] font-semibold uppercase text-indigo-700">
                  {item.priority}
                </span>
              </div>
            ))
          )}
          {project.requirements?.notes && (
            <p className="pt-1 text-stone-500">Notes: {project.requirements.notes}</p>
          )}
        </div>
      )}
    </div>
  )
}

export function UatPanel({ project, currentUser }: PanelProps) {
  const saveUat = useProjectsStore((s) => s.saveUat)
  const signOffUat = useProjectsStore((s) => s.signOffUat)
  const canEdit = canEditUat(project, currentUser)
  const mandatory = isBaGateMandatory(project)
  const passed = uatPassed(project)
  const baName = project.businessAnalystId
    ? getUserDisplayName(project.businessAnalystId)
    : 'Unassigned'

  const [cases, setCases] = useState<UatCase[]>(() => project.uat?.cases ?? [])
  const [outcome, setOutcome] = useState<(typeof UAT_OUTCOMES)[number]>(
    () => project.uat?.outcome ?? 'Pending',
  )
  const [notes, setNotes] = useState(() => project.uat?.notes ?? '')

  useEffect(() => {
    setCases(project.uat?.cases ?? [])
    setOutcome(project.uat?.outcome ?? 'Pending')
    setNotes(project.uat?.notes ?? '')
  }, [project.id, project.uat])

  const persist = (
    nextCases: UatCase[],
    nextOutcome: (typeof UAT_OUTCOMES)[number],
    nextNotes: string,
  ) => {
    if (!currentUser) return
    try {
      saveUat(
        project.id,
        {
          ...(project.uat ?? emptyUat()),
          cases: nextCases,
          outcome: nextOutcome,
          notes: nextNotes,
        },
        currentUser,
      )
      toast.success('UAT saved.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save UAT.')
    }
  }

  const handleSignOff = () => {
    if (!currentUser) return
    try {
      if (cases.length < 1 && currentUser.role !== 'Admin') {
        const seeded = [
          {
            id: `uat-${nanoid(6)}`,
            description: 'Self-attested acceptance (Tier1).',
            result: 'Pass' as const,
          },
        ]
        saveUat(
          project.id,
          {
            ...(project.uat ?? emptyUat()),
            cases: seeded,
            outcome: 'Pass',
            notes,
          },
          currentUser,
        )
        setCases(seeded)
        setOutcome('Pass')
      } else {
        saveUat(
          project.id,
          {
            ...(project.uat ?? emptyUat()),
            cases,
            outcome,
            notes,
          },
          currentUser,
        )
      }
      signOffUat(project.id, currentUser)
      toast.success('UAT signed off.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not sign off UAT.')
    }
  }

  const handleSelfAttest = () => {
    if (!currentUser) return
    try {
      if (cases.length < 1) {
        const seeded = [
          {
            id: `uat-${nanoid(6)}`,
            description: 'Self-attested acceptance (Tier1).',
            result: 'Pass' as const,
          },
        ]
        saveUat(
          project.id,
          {
            ...(project.uat ?? emptyUat()),
            cases: seeded,
            outcome: 'Pass',
            notes,
          },
          currentUser,
        )
        setCases(seeded)
        setOutcome('Pass')
      } else if (outcome !== 'Pass') {
        saveUat(
          project.id,
          {
            ...(project.uat ?? emptyUat()),
            cases,
            outcome: 'Pass',
            notes,
          },
          currentUser,
        )
        setOutcome('Pass')
      }
      signOffUat(project.id, currentUser)
      toast.success('UAT self-attested.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not self-attest UAT.')
    }
  }

  return (
    <div className="mb-3 rounded-md border-[0.5px] border-stone-200 bg-white p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-900">
          <ClipboardCheck className="h-3.5 w-3.5 text-indigo-600" />
          UAT
          {passed ? (
            <span className="rounded-sm bg-green-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-green-900">
              Pass
            </span>
          ) : project.uat?.outcome === 'Fail' ? (
            <span className="rounded-sm bg-red-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-800">
              Fail
            </span>
          ) : (
            <span className="rounded-sm bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-800">
              Pending
            </span>
          )}
        </div>
        <span className="text-[10px] text-stone-500">BA: {baName}</span>
      </div>

      {passed && project.uat?.signedOffAt && (
        <p className="mb-2 text-[10px] text-stone-500">
          Signed off {formatDateTime(project.uat.signedOffAt)}
          {project.uat.signedOffBy ? ` · ${getUserDisplayName(project.uat.signedOffBy)}` : ''}
        </p>
      )}

      {(outcome === 'Fail' || project.uat?.outcome === 'Fail') && (
        <div className="mb-2 rounded-md border-[0.5px] border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-900">
          UAT failed — remediate with Data Engineering, then re-run cases and sign off again.
        </div>
      )}

      {canEdit && !passed ? (
        <div className="space-y-2">
          {cases.map((uatCase, index) => (
            <div key={uatCase.id} className="flex flex-wrap items-center gap-1.5">
              <Input
                value={uatCase.description}
                onChange={(e) => {
                  const next = cases.map((row, i) =>
                    i === index ? { ...row, description: e.target.value } : row,
                  )
                  setCases(next)
                }}
                className="h-8 min-w-[140px] flex-1 text-xs"
                placeholder="Acceptance case"
              />
              <Select
                value={uatCase.result}
                onValueChange={(value) => {
                  const next = cases.map((row, i) =>
                    i === index ? { ...row, result: value as UatResult } : row,
                  )
                  setCases(next)
                }}
              >
                <SelectTrigger className="h-8 w-[110px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UAT_RESULTS.map((result) => (
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
                onClick={() => setCases(cases.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => setCases([...cases, newUatCase()])}
          >
            <Plus className="h-3.5 w-3.5" />
            Add case
          </Button>
          <div>
            <Label className="mb-1 text-[10px] text-stone-600">Overall outcome</Label>
            <Select
              value={outcome}
              onValueChange={(value) => setOutcome(value as (typeof UAT_OUTCOMES)[number])}
            >
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UAT_OUTCOMES.map((value) => (
                  <SelectItem key={value} value={value} className="text-xs">
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 text-[10px] text-stone-600">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[56px] text-xs"
              placeholder="Optional notes"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => persist(cases, outcome, notes)}
            >
              Save draft
            </Button>
            {!mandatory && (
              <Button
                type="button"
                variant="outline"
                className="h-8 text-xs"
                onClick={handleSelfAttest}
              >
                Self-attest UAT
              </Button>
            )}
            <Button
              type="button"
              className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700"
              disabled={outcome !== 'Pass' && currentUser?.role !== 'Admin'}
              onClick={handleSignOff}
            >
              Sign off UAT
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 text-[11px] text-stone-700">
          {(project.uat?.cases ?? []).length === 0 ? (
            <p className="text-stone-500">No UAT cases recorded yet.</p>
          ) : (
            (project.uat?.cases ?? []).map((uatCase) => (
              <div
                key={uatCase.id}
                className="flex items-start justify-between gap-2 rounded-md bg-stone-50 px-2.5 py-1.5"
              >
                <span>{uatCase.description}</span>
                <span className="shrink-0 text-[10px] font-semibold uppercase text-indigo-700">
                  {uatCase.result}
                </span>
              </div>
            ))
          )}
          <p className="pt-1 text-stone-500">
            Outcome: {project.uat?.outcome ?? 'Pending'}
            {project.uat?.notes ? ` · Notes: ${project.uat.notes}` : ''}
          </p>
        </div>
      )}
    </div>
  )
}
