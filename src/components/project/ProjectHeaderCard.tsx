import {
  Briefcase,
  Building2,
  Calendar,
  Hash,
  Layers,
  Pencil,
  Route,
  User,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ToolStackChips } from '@/components/common/ToolStackChips'
import { StatusBadge } from '@/components/common/StatusBadge'
import { TierBadge } from '@/components/common/TierBadge'
import { LifecycleStepper } from '@/components/project/LifecycleStepper'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SEED_USERS } from '@/data/seedRoles'
import { canAssignBusinessAnalyst } from '@/lib/baArtifacts'
import { stageProgress } from '@/lib/lifecycle'
import { getUserDisplayName } from '@/lib/projectDisplay'
import { formatDate, humanizeStage } from '@/lib/utils'
import type { Project, Tool, User as PortalUser } from '@/types'

type ProjectHeaderCardProps = {
  project: Project
  tools: Tool[]
  onCustomiseStack: () => void
  canCustomiseStack?: boolean
  currentUser?: PortalUser | null
  onAssignBusinessAnalyst?: (baUserId: string | null) => void
}

export function ProjectHeaderCard({
  project,
  tools,
  onCustomiseStack,
  canCustomiseStack = false,
  currentUser = null,
  onAssignBusinessAnalyst,
}: ProjectHeaderCardProps) {
  const progress = stageProgress(project)
  const sponsorName = project.sponsorId ? getUserDisplayName(project.sponsorId) : 'Unassigned'
  const baName = project.businessAnalystId
    ? getUserDisplayName(project.businessAnalystId)
    : null
  const showEhsHint =
    (project.status === 'Submitted' || project.status === 'ForEHSReview') &&
    Boolean(project.ehsCoordinatorId)
  const canAssignBa =
    Boolean(onAssignBusinessAnalyst) && canAssignBusinessAnalyst(currentUser)
  const baUsers = SEED_USERS.filter((user) => user.role === 'BusinessAnalyst')

  return (
    <>
      <div className="mb-3.5 rounded-lg border-[0.5px] border-stone-200 bg-white px-5 py-4">
        <div className="mb-2.5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h1 className="text-[17px] font-semibold text-stone-900">{project.title}</h1>
              <StatusBadge kind="project" status={project.status} />
              {project.tier && <TierBadge tier={project.tier} />}
              <span className="rounded-sm bg-[#EEEDFE] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#3C3489]">
                {humanizeStage(project.currentStage)}
              </span>
              {showEhsHint && (
                <span className="rounded-sm border-[0.5px] border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                  EHS review required
                </span>
              )}
              <Link
                to="/ci-portal"
                className="rounded-sm border-[0.5px] border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-stone-600 hover:border-indigo-200 hover:text-indigo-800"
              >
                Mirrored to CI Portal
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-500">
              <span className="inline-flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {getUserDisplayName(project.submitterId)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {sponsorName}
              </span>
              {(baName || canAssignBa) && (
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="h-3.5 w-3.5" />
                  {canAssignBa ? (
                    <Select
                      value={project.businessAnalystId ?? '__none__'}
                      onValueChange={(value) =>
                        onAssignBusinessAnalyst?.(value === '__none__' ? null : value)
                      }
                    >
                      <SelectTrigger className="h-7 w-[160px] border-stone-200 text-[11px]">
                        <SelectValue placeholder="Assign BA" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__" className="text-xs">
                          No BA
                        </SelectItem>
                        {baUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id} className="text-xs">
                            {user.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span>{baName}</span>
                  )}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {project.group} · {project.site}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(project.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Hash className="h-3.5 w-3.5" />
                {project.id}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" className="h-8 text-xs" disabled>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            {canCustomiseStack && (
              <Button
                type="button"
                className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700"
                onClick={onCustomiseStack}
              >
                <Layers className="h-3.5 w-3.5" />
                Customise Stack
              </Button>
            )}
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-stone-500">Tool stack:</span>
          <ToolStackChips toolStack={project.toolStack} tools={tools} showLabels />
        </div>

        <div className="mb-1 flex items-center justify-between text-[10px] text-stone-500">
          <span>Overall progress</span>
          <span className="font-medium text-stone-600">
            {progress.completed} of {progress.total} stages complete · {progress.pct}%
          </span>
        </div>
        <div className="h-[5px] overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#1D9E75] to-indigo-600"
            style={{ width: `${progress.pct}%` }}
          />
        </div>
      </div>

      <div className="mb-3.5 rounded-lg border-[0.5px] border-stone-200 bg-white px-5 py-4">
        <div className="mb-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-900">
            <Route className="h-4 w-4 text-indigo-600" />
            Lifecycle Stages
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-stone-500">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#1D9E75]" />
              Completed
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#EF9F27]" />
              In Progress
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-stone-300" />
              Not Started
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-600" />
              Blocked
            </span>
          </div>
        </div>
        <LifecycleStepper project={project} />
      </div>
    </>
  )
}
