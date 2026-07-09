import { FolderKanban, Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { GroupBadge } from '@/components/common/GroupBadge'
import { StatusBadge } from '@/components/common/StatusBadge'
import { TierBadge } from '@/components/common/TierBadge'
import { ToolStackChips } from '@/components/common/ToolStackChips'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useFilteredProjects } from '@/hooks/useFilteredProjects'
import { SEQUENTIAL_LIFECYCLE_STAGES, stageProgress } from '@/lib/lifecycle'
import { getUserDisplayName } from '@/lib/projectDisplay'
import { PROJECT_STATUSES } from '@/lib/projectStatus'
import { useCatalogStore } from '@/stores/catalogStore'
import { useAuthStore } from '@/stores/authStore'
import { SUBMIT_ROLES } from '@/lib/roles'
import { cn, formatRelative, humanizeStage } from '@/lib/utils'
import type { Group, LifecycleStage, ProjectStatus, Site } from '@/types'

const GROUPS: Group[] = ['Engineering', 'Field', 'PROGs', 'Marketing']
const SITES: Site[] = ['Cebu', 'Costa Rica', 'Japan', 'Korea']
const STATUSES = PROJECT_STATUSES

export function ProjectsListPage() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const tools = useCatalogStore((state) => state.tools)
  const { filters, setFilters, filteredProjects } = useFilteredProjects()

  const canCreate = currentUser && SUBMIT_ROLES.includes(currentUser.role)

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="All AI initiatives across GCS"
        action={
          canCreate ? (
            <Button asChild className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700">
              <Link to="/submit">
                <Plus className="h-3.5 w-3.5" />
                New Project
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-col gap-2 rounded-lg border-[0.5px] border-stone-200 bg-white p-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-stone-400" />
          <Input
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            placeholder="Search by title…"
            className="h-9 pl-8 text-xs"
          />
        </div>
        <Select
          value={filters.status}
          onValueChange={(value) =>
            setFilters({ ...filters, status: value as ProjectStatus | 'all' })
          }
        >
          <SelectTrigger className="h-9 w-full text-xs lg:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All statuses
            </SelectItem>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status} className="text-xs">
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.stage}
          onValueChange={(value) =>
            setFilters({ ...filters, stage: value as LifecycleStage | 'all' })
          }
        >
          <SelectTrigger className="h-9 w-full text-xs lg:w-[150px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All stages
            </SelectItem>
            {SEQUENTIAL_LIFECYCLE_STAGES.map((stage) => (
              <SelectItem key={stage} value={stage} className="text-xs">
                {humanizeStage(stage)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.group}
          onValueChange={(value) => setFilters({ ...filters, group: value as Group | 'all' })}
        >
          <SelectTrigger className="h-9 w-full text-xs lg:w-[140px]">
            <SelectValue placeholder="Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All groups
            </SelectItem>
            {GROUPS.map((group) => (
              <SelectItem key={group} value={group} className="text-xs">
                {group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.site}
          onValueChange={(value) => setFilters({ ...filters, site: value as Site | 'all' })}
        >
          <SelectTrigger className="h-9 w-full text-xs lg:w-[140px]">
            <SelectValue placeholder="Site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All sites
            </SelectItem>
            {SITES.map((site) => (
              <SelectItem key={site} value={site} className="text-xs">
                {site}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant={filters.myProjectsOnly ? 'default' : 'outline'}
          className={cn(
            'h-9 text-xs',
            filters.myProjectsOnly && 'bg-indigo-600 hover:bg-indigo-700',
          )}
          onClick={() =>
            setFilters({ ...filters, myProjectsOnly: !filters.myProjectsOnly })
          }
        >
          My Projects
        </Button>
      </div>

      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects match your filters"
          description="Try clearing filters or create a new project to get started."
          action={
            canCreate ? (
              <Button asChild className="mt-4 h-8 text-xs" variant="outline">
                <Link to="/submit">New Project</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border-[0.5px] border-stone-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Title</TableHead>
                <TableHead className="text-xs">Submitter</TableHead>
                <TableHead className="text-xs">Group</TableHead>
                <TableHead className="text-xs">Site</TableHead>
                <TableHead className="text-xs">Current Stage</TableHead>
                <TableHead className="text-xs">Stage Status</TableHead>
                <TableHead className="text-xs">Overall Status</TableHead>
                <TableHead className="text-xs">Tool Stack</TableHead>
                <TableHead className="text-xs">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => {
                const progress = stageProgress(project)
                const stageStatus = project.stageStatus[project.currentStage]
                return (
                  <TableRow key={project.id}>
                    <TableCell className="min-w-[220px]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link
                          to={`/projects/${project.id}`}
                          className="text-xs font-medium text-indigo-700 hover:underline"
                        >
                          {project.title}
                        </Link>
                        {project.tier && <TierBadge tier={project.tier} compact />}
                      </div>
                      <div className="mt-1.5 h-1 w-full max-w-[180px] overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#1D9E75] to-indigo-600"
                          style={{ width: `${progress.pct}%` }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-stone-700">
                      {getUserDisplayName(project.submitterId)}
                    </TableCell>
                    <TableCell>
                      <GroupBadge group={project.group} />
                    </TableCell>
                    <TableCell className="text-xs text-stone-700">{project.site}</TableCell>
                    <TableCell className="text-xs text-stone-700">
                      {humanizeStage(project.currentStage)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge kind="stage" status={stageStatus} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge kind="project" status={project.status} />
                    </TableCell>
                    <TableCell>
                      <ToolStackChips toolStack={project.toolStack} tools={tools} size="sm" />
                    </TableCell>
                    <TableCell className="text-xs text-stone-500">
                      {formatRelative(project.updatedAt)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
