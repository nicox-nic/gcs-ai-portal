import { useEffect, useMemo, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
  allSaqQuestionsAnswered,
  canEditSaq,
  canSetUsesExternalVendor,
  emptySaq,
  groupAnswersBySection,
  isSaqRequired,
  saqComplete,
} from '@/lib/vendorSaq'
import { useProjectsStore } from '@/stores/projectsStore'
import type { Project, SaqAnswer, SaqOutcome, SaqResponse, User } from '@/types'

type PanelProps = {
  project: Project
  currentUser: User | null
}

const RESPONSES: SaqResponse[] = ['Yes', 'No', 'NA']

export function VendorSaqPanel({ project, currentUser }: PanelProps) {
  const setUsesExternalVendor = useProjectsStore((s) => s.setUsesExternalVendor)
  const saveSaq = useProjectsStore((s) => s.saveSaq)
  const completeSaq = useProjectsStore((s) => s.completeSaq)

  const canToggle = canSetUsesExternalVendor(currentUser)
  const canEdit = canEditSaq(project, currentUser)
  const required = isSaqRequired(project)
  const complete = saqComplete(project)

  const [answers, setAnswers] = useState<SaqAnswer[]>(
    () => project.vendorSaq?.answers ?? emptySaq().answers,
  )
  const [notes, setNotes] = useState(() => project.vendorSaq?.notes ?? '')

  useEffect(() => {
    setAnswers(project.vendorSaq?.answers ?? emptySaq().answers)
    setNotes(project.vendorSaq?.notes ?? '')
  }, [project.id, project.vendorSaq])

  const sections = useMemo(() => groupAnswersBySection(answers), [answers])
  const answered = allSaqQuestionsAnswered({
    answers,
    outcome: 'Pending',
    notes,
    completedBy: null,
    completedAt: null,
  })
  const signedFail =
    project.vendorSaq?.outcome === 'Fail' && project.vendorSaq.completedBy !== null

  const persistDraft = (nextAnswers: SaqAnswer[], nextNotes: string) => {
    if (!currentUser || !canEdit) return
    try {
      saveSaq(
        project.id,
        { answers: nextAnswers, notes: nextNotes, outcome: 'Pending' },
        currentUser,
      )
      toast.success('SAQ draft saved.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save SAQ.')
    }
  }

  const handleToggle = (value: boolean) => {
    if (!currentUser) return
    try {
      setUsesExternalVendor(project.id, value, currentUser)
      toast.success(
        value
          ? 'Marked as third-party AI vendor — SAQ required.'
          : 'Marked internal-only — SAQ not required.',
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update vendor flag.')
    }
  }

  const handleComplete = (outcome: SaqOutcome) => {
    if (!currentUser) return
    try {
      saveSaq(project.id, { answers, notes, outcome: 'Pending' }, currentUser)
      completeSaq(project.id, outcome, currentUser)
      toast.success(
        outcome === 'Fail'
          ? 'SAQ completed as Fail — remediate before Supplier Oversight can complete.'
          : `SAQ completed (${outcome}).`,
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not complete SAQ.')
    }
  }

  const setResponse = (id: string, response: SaqResponse) => {
    const next = answers.map((a) => (a.id === id ? { ...a, response } : a))
    setAnswers(next)
  }

  return (
    <div className="mb-3 rounded-md border-[0.5px] border-stone-200 bg-white p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-3.5 w-3.5 text-indigo-700" />
          <span className="text-[11px] font-semibold text-stone-900">Vendor AI-SAQ</span>
          {complete && (
            <span className="rounded-sm border border-green-200 bg-[#EAF3DE] px-1.5 py-0.5 text-[9px] font-semibold uppercase text-green-900">
              {project.vendorSaq?.outcome}
            </span>
          )}
          {signedFail && (
            <span className="rounded-sm border border-red-200 bg-[#FCEBEB] px-1.5 py-0.5 text-[9px] font-semibold uppercase text-red-800">
              Fail
            </span>
          )}
        </div>
        <span className="text-[10px] text-stone-500">Owner: Risk & Compliance (role-wide)</span>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border-[0.5px] border-stone-200 bg-stone-50 px-2.5 py-2">
        <div>
          <p className="text-[11px] font-medium text-stone-900">Uses third-party AI vendor</p>
          <p className="text-[10px] text-stone-500">
            When on, the 31-question Vendor AI-SAQ gates Supplier Oversight completion.
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={required ? 'default' : 'outline'}
            className={`h-7 text-[10px] ${required ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
            disabled={!canToggle}
            onClick={() => handleToggle(true)}
          >
            Yes
          </Button>
          <Button
            type="button"
            size="sm"
            variant={!required ? 'default' : 'outline'}
            className={`h-7 text-[10px] ${!required ? 'bg-stone-700 hover:bg-stone-800' : ''}`}
            disabled={!canToggle}
            onClick={() => handleToggle(false)}
          >
            No (internal-only)
          </Button>
        </div>
      </div>

      {!required && (
        <p className="rounded-md border-[0.5px] border-green-200 bg-[#EAF3DE] px-2.5 py-2 text-[11px] text-green-900">
          SAQ not required (internal-only). Supplier Oversight may complete without a Vendor AI-SAQ.
        </p>
      )}

      {required && (
        <>
          {signedFail && (
            <p className="mb-2 rounded-md border-[0.5px] border-red-200 bg-[#FCEBEB] px-2.5 py-2 text-[11px] text-red-800">
              SAQ Fail — remediate with the vendor, update answers, then re-complete as Pass or Waive
              with justification.
            </p>
          )}

          {complete && project.vendorSaq?.completedAt && (
            <p className="mb-2 text-[10px] text-stone-500">
              Completed {formatDateTime(project.vendorSaq.completedAt)}
              {project.vendorSaq.completedBy
                ? ` · ${getUserDisplayName(project.vendorSaq.completedBy)}`
                : ''}
            </p>
          )}

          <div className="mb-3 max-h-80 space-y-3 overflow-y-auto pr-1">
            {sections.map(({ section, answers: sectionAnswers }) => (
              <div key={section}>
                <p className="mb-1.5 text-[10px] font-semibold tracking-wide text-indigo-800 uppercase">
                  {section}
                </p>
                <div className="space-y-2">
                  {sectionAnswers.map((answer) => (
                    <div
                      key={answer.id}
                      className="rounded-md border-[0.5px] border-stone-100 bg-stone-50/80 px-2 py-1.5"
                    >
                      <p className="mb-1 text-[11px] text-stone-800">
                        <span className="font-medium text-stone-500">{answer.id}</span>{' '}
                        {answer.question}
                      </p>
                      {canEdit && !complete ? (
                        <Select
                          value={answer.response ?? undefined}
                          onValueChange={(v) => setResponse(answer.id, v as SaqResponse)}
                        >
                          <SelectTrigger className="h-7 w-28 text-[10px]">
                            <SelectValue placeholder="Answer" />
                          </SelectTrigger>
                          <SelectContent>
                            {RESPONSES.map((r) => (
                              <SelectItem key={r} value={r} className="text-xs">
                                {r === 'NA' ? 'N/A' : r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-[10px] font-medium text-stone-600">
                          {answer.response ?? '—'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-2 space-y-1">
            <Label className="text-[10px]">Overall notes / waiver justification</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!canEdit || complete}
              className="min-h-[60px] text-xs"
              placeholder="Notes; required when Waiving"
            />
          </div>

          {canEdit && !complete && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => persistDraft(answers, notes)}
              >
                Save draft
              </Button>
              <Button
                type="button"
                className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700"
                disabled={!answered}
                onClick={() => handleComplete('Pass')}
              >
                Complete — Pass
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 text-xs"
                disabled={!answered || !notes.trim()}
                onClick={() => handleComplete('Waived')}
              >
                Complete — Waive
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 border-red-200 text-xs text-red-800 hover:bg-red-50"
                disabled={!answered}
                onClick={() => handleComplete('Fail')}
              >
                Complete — Fail
              </Button>
            </div>
          )}

          {!canEdit && !complete && (
            <p className="text-[10px] text-stone-500">
              Only Risk & Compliance or Admin can edit and complete the Vendor AI-SAQ.
            </p>
          )}
        </>
      )}
    </div>
  )
}
