import { useMemo } from 'react'
import { FolderKanban } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useProfileStore } from '@/stores/profileStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { formatRelative, humanizeStage } from '@/lib/utils'
import type { Project } from '@/types'

const DRAFT_STATUSES = new Set(['IdeaDraft', 'QualifiedDraft'])

function ProjectEntryRow({ project }: { project: Project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="flex items-center justify-between gap-3 rounded-md border-[0.5px] border-stone-200 bg-white px-3.5 py-2.5 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
    >
      <div className="min-w-0">
        <div className="truncate text-xs font-medium text-stone-900">{project.title}</div>
        <div className="mt-0.5 text-[11px] text-stone-500">
          {humanizeStage(project.currentStage)} · updated {formatRelative(project.updatedAt)}
        </div>
      </div>
      <StatusBadge kind="project" status={project.status} />
    </Link>
  )
}

export function ProfilePage() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const profile = useProfileStore((state) =>
    currentUser ? state.getProfile(currentUser.id) : undefined,
  )
  const isComplete = useProfileStore((state) =>
    currentUser ? state.isComplete(currentUser.id) : false,
  )
  const projects = useProjectsStore((state) => state.projects)

  const myProjects = useMemo(() => {
    if (!currentUser) return []
    return projects
      .filter((project) => project.submitterId === currentUser.id)
      .sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
  }, [projects, currentUser])

  const drafts = myProjects.filter((project) => DRAFT_STATUSES.has(project.status))
  const active = myProjects.filter((project) => !DRAFT_STATUSES.has(project.status))

  if (!currentUser) {
    return null
  }

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle={`${currentUser.displayName} · ${currentUser.department}`}
        className="mb-5"
        action={
          <Button asChild className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700">
            <Link to="/profile/setup">Edit profile</Link>
          </Button>
        }
      />

      <div className="mb-5 rounded-lg border-[0.5px] border-stone-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-stone-900">Profile summary</h2>
          {!isComplete && (
            <span className="rounded-sm bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
              Incomplete
            </span>
          )}
        </div>

        {!isComplete || !profile ? (
          <div className="rounded-md border-[0.5px] border-dashed border-stone-200 bg-stone-50 px-3.5 py-4 text-xs text-stone-600">
            <p className="mb-3">
              Complete your profile so new project submissions can pre-fill skill level, tools, and
              integrations.
            </p>
            <Button asChild className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700">
              <Link to="/profile/setup">Complete profile</Link>
            </Button>
          </div>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-[11px] text-stone-500">Skill level</dt>
              <dd className="mt-0.5 text-xs font-medium text-stone-900">{profile.skillLevel}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-stone-500">Tool chain</dt>
              <dd className="mt-0.5 text-xs text-stone-900">
                {profile.toolChain.length > 0 ? profile.toolChain.join(', ') : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-stone-500">Integration targets</dt>
              <dd className="mt-0.5 text-xs text-stone-900">
                {profile.integrationTargets.length > 0
                  ? profile.integrationTargets.join(', ')
                  : '—'}
              </dd>
            </div>
          </dl>
        )}
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="mb-1 text-sm font-medium text-stone-900">My Entries</h2>
          <p className="mb-3 text-[11px] text-stone-500">
            Projects you submitted. Drafts and active entries are listed separately — AI-assisted
            session history will land here in a later phase.
          </p>
        </div>

        {myProjects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No entries yet"
            description="When you submit or save a draft project, it will appear here."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Drafts ({drafts.length})
              </h3>
              <div className="space-y-2">
                {drafts.length === 0 ? (
                  <p className="text-xs text-stone-500">No draft entries.</p>
                ) : (
                  drafts.map((project) => (
                    <ProjectEntryRow key={project.id} project={project} />
                  ))
                )}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Submitted & active ({active.length})
              </h3>
              <div className="space-y-2">
                {active.length === 0 ? (
                  <p className="text-xs text-stone-500">No submitted entries yet.</p>
                ) : (
                  active.map((project) => (
                    <ProjectEntryRow key={project.id} project={project} />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  )
}
