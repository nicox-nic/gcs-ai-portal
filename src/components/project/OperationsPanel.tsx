import { useEffect, useState } from 'react'
import { Activity, AlertTriangle } from 'lucide-react'
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
  canOperate,
  deriveHealth,
  openIncidentCount,
} from '@/lib/operations'
import { getUserDisplayName } from '@/lib/projectDisplay'
import { cn, formatDateTime } from '@/lib/utils'
import { useProjectsStore } from '@/stores/projectsStore'
import type {
  DriftState,
  HealthState,
  IncidentSeverity,
  Project,
  User,
} from '@/types'

type PanelProps = {
  project: Project
  currentUser: User | null
  compact?: boolean
}

const HEALTH_STYLES: Record<HealthState, string> = {
  Healthy: 'border-green-200 bg-green-50 text-green-900',
  Watch: 'border-amber-200 bg-amber-50 text-amber-900',
  Incident: 'border-red-200 bg-red-50 text-red-800',
}

const DRIFT_STYLES: Record<DriftState, string> = {
  None: 'border-stone-200 bg-stone-50 text-stone-600',
  Suspected: 'border-amber-200 bg-amber-50 text-amber-900',
  Confirmed: 'border-red-200 bg-red-50 text-red-800',
}

export function HealthChip({ project, className }: { project: Project; className?: string }) {
  if (!project.operations) return null
  const health = deriveHealth(project)
  const open = openIncidentCount(project)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border-[0.5px] px-2 py-0.5 text-[10px] font-semibold uppercase',
        HEALTH_STYLES[health],
        className,
      )}
    >
      <Activity className="h-3 w-3" aria-hidden />
      {health}
      {open > 0 ? ` · ${open}` : ''}
    </span>
  )
}

export function OperationsPanel({ project, currentUser, compact = false }: PanelProps) {
  const setHealthStatus = useProjectsStore((s) => s.setHealthStatus)
  const logIncident = useProjectsStore((s) => s.logIncident)
  const closeIncident = useProjectsStore((s) => s.closeIncident)
  const setDrift = useProjectsStore((s) => s.setDrift)
  const recordUseReview = useProjectsStore((s) => s.recordUseReview)

  const canEdit = canOperate(project, currentUser)
  const ops = project.operations
  const health = deriveHealth(project)
  const ownerName = project.maintenanceOwnerId
    ? getUserDisplayName(project.maintenanceOwnerId)
    : 'Unassigned (any M&S)'

  const [healthPick, setHealthPick] = useState<HealthState>(ops?.health ?? 'Healthy')
  const [driftPick, setDriftPick] = useState<DriftState>(ops?.drift ?? 'None')
  const [driftNote, setDriftNote] = useState(ops?.driftNote ?? '')
  const [severity, setSeverity] = useState<IncidentSeverity>('Medium')
  const [summary, setSummary] = useState('')
  const [incidentNote, setIncidentNote] = useState('')
  const [closeNotes, setCloseNotes] = useState<Record<string, string>>({})
  const [reviewNote, setReviewNote] = useState('')

  useEffect(() => {
    setHealthPick(ops?.health ?? 'Healthy')
    setDriftPick(ops?.drift ?? 'None')
    setDriftNote(ops?.driftNote ?? '')
  }, [project.id, ops?.health, ops?.drift, ops?.driftNote])

  if (!ops && project.status !== 'Active' && project.currentStage !== 'Use') {
    return null
  }

  const incidents = ops?.incidents ?? []
  const openBlocked = openIncidentCount(project) > 0

  return (
    <div
      className={cn(
        'mb-3 rounded-md border-[0.5px] border-stone-200 bg-white p-3',
        compact && 'p-2.5',
      )}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-700" aria-hidden />
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-stone-700">
            Operations (Use)
          </h4>
          <HealthChip project={project} />
        </div>
        <span className="text-[10px] text-stone-500">Owner: {ownerName}</span>
      </div>

      {!ops ? (
        <p className="text-[11px] text-stone-500">
          Operations record initialises when the project goes live.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label className="mb-1 text-[10px] text-stone-600">Health</Label>
              {canEdit ? (
                <Select
                  value={openBlocked ? 'Incident' : healthPick}
                  onValueChange={(value) => {
                    const next = value as HealthState
                    setHealthPick(next)
                    if (!currentUser) return
                    try {
                      setHealthStatus(project.id, next, currentUser)
                      toast.success(`Health set to ${next}.`)
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : 'Could not set health.')
                    }
                  }}
                  disabled={openBlocked}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['Healthy', 'Watch', 'Incident'] as HealthState[]).map((h) => (
                      <SelectItem key={h} value={h} className="text-xs">
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span
                  className={cn(
                    'inline-flex rounded-sm border-[0.5px] px-2 py-1 text-[11px] font-medium',
                    HEALTH_STYLES[health],
                  )}
                >
                  {health}
                </span>
              )}
              {openBlocked && (
                <p className="mt-1 text-[10px] text-red-700">
                  Locked to Incident while open incidents exist.
                </p>
              )}
            </div>
            <div>
              <Label className="mb-1 text-[10px] text-stone-600">Model drift</Label>
              {canEdit ? (
                <div className="space-y-1.5">
                  <Select
                    value={driftPick}
                    onValueChange={(value) => setDriftPick(value as DriftState)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['None', 'Suspected', 'Confirmed'] as DriftState[]).map((d) => (
                        <SelectItem key={d} value={d} className="text-xs">
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={driftNote}
                    onChange={(e) => setDriftNote(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="Drift note"
                  />
                  <Button
                    type="button"
                    className="h-7 bg-indigo-600 text-[11px] hover:bg-indigo-700"
                    onClick={() => {
                      if (!currentUser) return
                      try {
                        setDrift(project.id, driftPick, driftNote, currentUser)
                        toast.success(`Drift set to ${driftPick}.`)
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : 'Could not set drift.',
                        )
                      }
                    }}
                  >
                    Save drift
                  </Button>
                </div>
              ) : (
                <div>
                  <span
                    className={cn(
                      'inline-flex rounded-sm border-[0.5px] px-2 py-1 text-[11px] font-medium',
                      DRIFT_STYLES[ops.drift],
                    )}
                  >
                    {ops.drift}
                  </span>
                  {ops.driftNote && (
                    <p className="mt-1 text-[10px] text-stone-500">{ops.driftNote}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label className="text-[10px] text-stone-600">Incident log</Label>
              <span className="text-[10px] text-stone-400">
                {openIncidentCount(project)} open
              </span>
            </div>
            {incidents.length === 0 ? (
              <p className="mb-2 text-[11px] text-stone-500">No incidents logged.</p>
            ) : (
              <ul className="mb-2 max-h-40 space-y-1.5 overflow-y-auto">
                {incidents
                  .slice()
                  .reverse()
                  .map((inc) => (
                    <li
                      key={inc.id}
                      className="rounded-sm border-[0.5px] border-stone-200 bg-stone-50 px-2 py-1.5 text-[11px]"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            'rounded-sm px-1 py-0.5 text-[9px] font-semibold uppercase',
                            inc.status === 'Open'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-stone-200 text-stone-600',
                          )}
                        >
                          {inc.status}
                        </span>
                        <span className="font-medium text-stone-800">{inc.severity}</span>
                        <span className="text-stone-500">{formatDateTime(inc.openedAt)}</span>
                      </div>
                      <p className="mt-0.5 text-stone-700">{inc.summary}</p>
                      {inc.note && <p className="text-[10px] text-stone-500">{inc.note}</p>}
                      {canEdit && inc.status === 'Open' && (
                        <div className="mt-1.5 flex gap-1.5">
                          <Input
                            value={closeNotes[inc.id] ?? ''}
                            onChange={(e) =>
                              setCloseNotes((prev) => ({ ...prev, [inc.id]: e.target.value }))
                            }
                            className="h-7 flex-1 text-[11px]"
                            placeholder="Close note"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="h-7 text-[11px]"
                            onClick={() => {
                              if (!currentUser) return
                              try {
                                closeIncident(
                                  project.id,
                                  inc.id,
                                  closeNotes[inc.id] ?? '',
                                  currentUser,
                                )
                                toast.success('Incident closed.')
                              } catch (error) {
                                toast.error(
                                  error instanceof Error
                                    ? error.message
                                    : 'Could not close incident.',
                                )
                              }
                            }}
                          >
                            Close
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
              </ul>
            )}
            {canEdit && (
              <div className="space-y-1.5 rounded-sm border border-dashed border-stone-200 p-2">
                <div className="grid gap-1.5 sm:grid-cols-[120px_1fr]">
                  <Select
                    value={severity}
                    onValueChange={(v) => setSeverity(v as IncidentSeverity)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['Low', 'Medium', 'High'] as IncidentSeverity[]).map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="Incident summary"
                  />
                </div>
                <Textarea
                  value={incidentNote}
                  onChange={(e) => setIncidentNote(e.target.value)}
                  className="min-h-12 text-xs"
                  placeholder="Optional note"
                />
                <Button
                  type="button"
                  className="h-7 bg-red-700 text-[11px] hover:bg-red-800"
                  onClick={() => {
                    if (!currentUser) return
                    try {
                      logIncident(
                        project.id,
                        { severity, summary, note: incidentNote },
                        currentUser,
                      )
                      setSummary('')
                      setIncidentNote('')
                      toast.success('Incident logged.')
                    } catch (error) {
                      toast.error(
                        error instanceof Error ? error.message : 'Could not log incident.',
                      )
                    }
                  }}
                >
                  Log incident
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-2 border-t border-stone-100 pt-2">
            <div className="text-[10px] text-stone-500">
              Last review:{' '}
              {ops.lastReviewedAt ? formatDateTime(ops.lastReviewedAt) : 'Never'}
            </div>
            {canEdit && (
              <>
                <Input
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="h-7 min-w-[160px] flex-1 text-[11px]"
                  placeholder="Monitoring review note"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-7 text-[11px]"
                  onClick={() => {
                    if (!currentUser) return
                    try {
                      recordUseReview(project.id, reviewNote, currentUser)
                      setReviewNote('')
                      toast.success('Monitoring review recorded.')
                    } catch (error) {
                      toast.error(
                        error instanceof Error ? error.message : 'Could not record review.',
                      )
                    }
                  }}
                >
                  Record monitoring review
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
